# frozen_string_literal: true

require "test_helper"

class StatusControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:admin)
    # Enable memory cache for these tests (test env uses null_store)
    @original_cache = Rails.cache
    Rails.cache = ActiveSupport::Cache::MemoryStore.new
  end

  teardown do
    Rails.cache = @original_cache
  end

  test "GET /status returns 200 when authenticated" do
    sign_in_as(@user)
    get "/status"
    assert_response :success
  end

  test "GET /status redirects when not authenticated" do
    get "/status"
    assert_redirected_to login_path
  end

  test "GET /status/poll returns JSON with correct shape" do
    sign_in_as(@user)

    # Set some cached data (as hash with string keys, like it comes from the API)
    test_data = {
      "agent_status" => { "running" => true, "session_count" => 1 },
      "token_burn" => { "main_tokens" => "1000/200000", "main_context_percent" => 0.5 },
      "tasks" => { "cron_jobs" => [], "pending_count" => 0, "cron_health" => "healthy", "cron_errors" => [] },
      "memory" => { "backend" => "qmd", "file_count" => 104, "vector_count" => 558 },
      "session_health" => { "uptime" => "1h 30m" },
      "sessions" => [],
      "fetched_at" => "2025-01-30 12:00:00 PST"
    }
    Rails.cache.write("openclaw_status", test_data)

    get "/status/poll"
    assert_response :success

    json = response.parsed_body
    assert_equal true, json["agent_status"]["running"]
    assert_equal 1, json["agent_status"]["session_count"]
    assert_equal "1000/200000", json["token_burn"]["main_tokens"]
    assert_kind_of Array, json["tasks"]["cron_jobs"]
    assert_kind_of Array, json["sessions"]
  end

  test "POST /status/keepalive returns 200" do
    sign_in_as(@user)
    post "/status/keepalive"
    assert_response :success
  end

  test "empty status data includes cron_health and cron_errors" do
    sign_in_as(@user)

    # Clear cache to get empty data
    Rails.cache.delete("openclaw_status")

    get "/status/poll"
    assert_response :success

    json = response.parsed_body
    assert json.key?("tasks")
    assert_equal "healthy", json["tasks"]["cron_health"]
    assert_kind_of Array, json["tasks"]["cron_errors"]
    assert_equal [], json["tasks"]["cron_errors"]
  end

  test "status data includes all required top-level keys" do
    sign_in_as(@user)

    Rails.cache.delete("openclaw_status")

    get "/status/poll"
    assert_response :success

    json = response.parsed_body
    assert json.key?("agent_status")
    assert json.key?("token_burn")
    assert json.key?("tasks")
    assert json.key?("memory")
    assert json.key?("session_health")
    assert json.key?("sessions")
    assert json.key?("fetched_at")
  end

  test "cached data is returned when available" do
    sign_in_as(@user)

    cached_data = {
      "agent_status" => { "running" => false },
      "token_burn" => { "main_tokens" => "0/0" },
      "tasks" => { "cron_health" => "degraded", "cron_errors" => [ "test error" ] },
      "fetched_at" => "cached timestamp"
    }
    Rails.cache.write("openclaw_status", cached_data)

    get "/status/poll"
    assert_response :success

    json = response.parsed_body
    assert_equal false, json["agent_status"]["running"]
    assert_equal "degraded", json["tasks"]["cron_health"]
    assert_equal [ "test error" ], json["tasks"]["cron_errors"]
  end
end
