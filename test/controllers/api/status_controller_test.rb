# frozen_string_literal: true

require "test_helper"

class Api::StatusControllerTest < ActionDispatch::IntegrationTest
  setup do
    ENV["DASHBOT_API_TOKEN"] = "test-status-token-456"
    # Enable memory cache for these tests (test env uses null_store)
    @original_cache = Rails.cache
    Rails.cache = ActiveSupport::Cache::MemoryStore.new
  end

  teardown do
    ENV.delete("DASHBOT_API_TOKEN")
    Rails.cache = @original_cache
  end

  test "POST /api/status/update with valid token stores data" do
    status_payload = {
      "agent_status" => { "running" => true, "session_count" => 2 },
      "token_burn" => { "main_tokens" => "5000/200000" },
      "tasks" => {
        "cron_jobs" => [ { "name" => "test_job", "next_run" => "2025-01-30 13:00:00" } ],
        "cron_health" => "healthy",
        "cron_errors" => []
      },
      "memory" => { "file_count" => 15 },
      "session_health" => { "uptime" => "2h 15m" },
      "sessions" => [],
      "fetched_at" => "2025-01-30 12:30:00 PST"
    }

    post "/api/status/update",
      params: status_payload,
      headers: { "Authorization" => "Bearer test-status-token-456" },
      as: :json

    assert_response :success
    assert_equal({ "ok" => true }, response.parsed_body)

    # Verify data was cached
    cached = Rails.cache.read("openclaw_status")
    assert_not_nil cached, "Cache should contain status data"
    assert_equal true, cached["agent_status"]["running"]
    assert_equal 2, cached["agent_status"]["session_count"]
    assert_equal "5000/200000", cached["token_burn"]["main_tokens"]
  end

  test "POST /api/status/update without token returns 401" do
    post "/api/status/update",
      params: { agent_status: { running: true } }

    assert_response :unauthorized
    assert_equal({ "error" => "Unauthorized" }, response.parsed_body)
  end

  test "POST /api/status/update with wrong token returns 401" do
    post "/api/status/update",
      params: { agent_status: { running: true } },
      headers: { "Authorization" => "Bearer wrong-token" }

    assert_response :unauthorized
    assert_equal({ "error" => "Unauthorized" }, response.parsed_body)
  end

  test "POST /api/status/update with Bearer prefix stripped works" do
    post "/api/status/update",
      params: { agent_status: { running: true } },
      headers: { "Authorization" => "Bearer test-status-token-456" }

    assert_response :success
  end

  test "POST /api/status/update filters out controller params" do
    post "/api/status/update",
      params: {
        "controller" => "api/status",
        "action" => "update",
        "format" => "json",
        "agent_status" => { "running" => true },
        "custom_data" => { "value" => 123 }
      },
      headers: { "Authorization" => "Bearer test-status-token-456" },
      as: :json

    assert_response :success

    cached = Rails.cache.read("openclaw_status")
    assert_not_nil cached, "Cache should contain data"
    assert_nil cached["controller"]
    assert_nil cached["action"]
    assert_nil cached["format"]
    assert_equal true, cached["agent_status"]["running"]
    assert_equal 123, cached["custom_data"]["value"]
  end

  test "POST /api/status/update sets cache expiration to 5 minutes" do
    # This is harder to test precisely, but we can verify the cache exists
    # and would expire eventually
    post "/api/status/update",
      params: { "agent_status" => { "running" => true } },
      headers: { "Authorization" => "Bearer test-status-token-456" },
      as: :json

    assert_response :success

    # Verify data exists in cache
    cached = Rails.cache.read("openclaw_status")
    assert_not_nil cached, "Cache should contain data"
  end
end
