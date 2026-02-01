# frozen_string_literal: true

require "test_helper"

class Api::AgentEventsControllerTest < ActionDispatch::IntegrationTest
  setup do
    ENV["DASHBOT_API_TOKEN"] = "test-events-token-789"
    @headers = { "Authorization" => "Bearer test-events-token-789" }
  end

  teardown do
    ENV.delete("DASHBOT_API_TOKEN")
  end

  test "GET /api/agent/events returns empty list initially" do
    get "/api/agent/events", headers: @headers
    assert_response :success

    data = JSON.parse(response.body)
    assert_equal [], data["events"]
    assert_equal 0, data["total"]
  end

  test "GET /api/agent/events requires authentication" do
    get "/api/agent/events"
    assert_response :unauthorized
  end

  test "POST /api/agent/events creates a spawned event" do
    assert_difference "AgentEvent.count", 1 do
      post "/api/agent/events", params: {
        event_type: "spawned",
        agent_label: "test-task",
        session_key: "agent:main:subagent:abc123",
        model: "claude-opus-4-5",
        description: "Build a test feature"
      }, headers: @headers
    end

    assert_response :created
    data = JSON.parse(response.body)
    assert data["ok"]
    assert_equal "spawned", data["event"]["event_type"]
    assert_equal "test-task", data["event"]["agent_label"]
  end

  test "POST /api/agent/events creates a completed event with metadata" do
    post "/api/agent/events", params: {
      event_type: "completed",
      agent_label: "test-task",
      session_key: "agent:main:subagent:abc123",
      model: "claude-opus-4-5",
      description: "Task completed",
      metadata: { duration_seconds: 300, result: "PR #7 created" }
    }, headers: @headers

    assert_response :created
    event = AgentEvent.last
    assert_equal "300", event.metadata["duration_seconds"].to_s
    assert_equal "PR #7 created", event.metadata["result"]
  end

  test "POST /api/agent/events rejects invalid event type" do
    post "/api/agent/events", params: {
      event_type: "invalid_type",
      agent_label: "test-task"
    }, headers: @headers

    assert_response :unprocessable_entity
    data = JSON.parse(response.body)
    assert_includes data["error"].downcase, "event type"
  end

  test "POST /api/agent/events requires authentication" do
    post "/api/agent/events", params: { event_type: "spawned" }
    assert_response :unauthorized
  end

  test "GET /api/agent/events returns events in reverse chronological order" do
    AgentEvent.create!(event_type: "spawned", agent_label: "first", created_at: 10.minutes.ago)
    AgentEvent.create!(event_type: "spawned", agent_label: "second", created_at: 5.minutes.ago)
    AgentEvent.create!(event_type: "completed", agent_label: "first", created_at: 1.minute.ago)

    get "/api/agent/events", headers: @headers
    assert_response :success

    data = JSON.parse(response.body)
    assert_equal 3, data["events"].length
    assert_equal "completed", data["events"][0]["event_type"]
    assert_equal "spawned", data["events"][1]["event_type"]
    assert_equal "second", data["events"][1]["agent_label"]
  end

  test "GET /api/agent/events respects limit parameter" do
    5.times { |i| AgentEvent.create!(event_type: "spawned", agent_label: "task-#{i}") }

    get "/api/agent/events", params: { limit: 2 }, headers: @headers
    assert_response :success

    data = JSON.parse(response.body)
    assert_equal 2, data["events"].length
  end

  test "GET /api/agent/events can filter by type" do
    AgentEvent.create!(event_type: "spawned", agent_label: "task-1")
    AgentEvent.create!(event_type: "completed", agent_label: "task-1")
    AgentEvent.create!(event_type: "cron_run", agent_label: "morning-check")

    get "/api/agent/events", params: { type: "spawned" }, headers: @headers
    assert_response :success

    data = JSON.parse(response.body)
    assert_equal 1, data["events"].length
    assert_equal "spawned", data["events"][0]["event_type"]
  end
end
