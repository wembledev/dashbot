# frozen_string_literal: true

require "test_helper"
require "action_cable/connection/test_case"

class ConnectionTest < ActionCable::Connection::TestCase
  tests ApplicationCable::Connection

  setup do
    ENV["DASHBOT_API_TOKEN"] = "test-token-123"
  end

  teardown do
    ENV.delete("DASHBOT_API_TOKEN")
  end

  test "connects with valid session" do
    user = users(:admin)
    connect params: {}, session: { user_id: user.id }
    assert_equal user, connection.current_user
  end

  test "connects with valid token" do
    connect params: { token: "test-token-123" }
    assert_equal users(:admin), connection.current_user
  end

  test "rejects connection without session or token" do
    assert_reject_connection { connect }
  end

  test "rejects connection with invalid token" do
    assert_reject_connection { connect params: { token: "bad-token" } }
  end

  test "rejects connection with empty token when env is set" do
    assert_reject_connection { connect params: { token: "" } }
  end
end
