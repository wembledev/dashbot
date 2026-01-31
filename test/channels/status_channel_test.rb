# frozen_string_literal: true

require "test_helper"
require "action_cable/channel/test_case"
require "action_cable/test_helper"

class StatusChannelTest < ActionCable::Channel::TestCase
  setup do
    @user = users(:admin)
    stub_connection current_user: @user

    # Reset viewer count between tests
    StatusChannel.class_variable_set(:@@viewer_count, 0)
  end

  test "subscribes to status_updates stream" do
    subscribe
    assert subscription.confirmed?
    assert_has_stream "status_updates"
  end

  test "increments viewer count on subscription" do
    assert_equal 0, StatusChannel.viewer_count

    subscribe
    assert_equal 1, StatusChannel.viewer_count
  end

  test "decrements viewer count on unsubscription" do
    subscribe
    assert_equal 1, StatusChannel.viewer_count

    unsubscribe
    assert_equal 0, StatusChannel.viewer_count
  end

  test "broadcasts status_requested when first viewer subscribes" do
    assert_broadcasts("plugin_commands", 1) do
      subscribe
    end
  end

  test "does not broadcast status_requested when second viewer subscribes" do
    # First viewer
    subscribe

    # Reset broadcasts count
    @subscription = nil

    # Second viewer should not trigger another broadcast
    assert_no_broadcasts("plugin_commands") do
      subscribe
    end
  end

  test "broadcasts status_stopped when last viewer leaves" do
    subscribe

    assert_broadcasts("plugin_commands", 1) do
      unsubscribe
    end
  end

  test "broadcast_status class method broadcasts to status_updates stream" do
    test_data = {
      agent_status: { running: true },
      token_burn: { main_tokens: "1000/200000" }
    }

    assert_broadcasts("status_updates", 1) do
      StatusChannel.broadcast_status(test_data)
    end
  end

  test "viewer_count class method returns current count" do
    assert_equal 0, StatusChannel.viewer_count

    subscribe
    assert_equal 1, StatusChannel.viewer_count
  end
end
