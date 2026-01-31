# frozen_string_literal: true

require "test_helper"
require "action_cable/channel/test_case"
require "action_cable/test_helper"

class ChatChannelTest < ActionCable::Channel::TestCase
  setup do
    @user = users(:admin)
    @session = chat_sessions(:navigation_chat)
    stub_connection current_user: @user
  end

  test "subscribes to existing session" do
    subscribe session_id: @session.id
    assert subscription.confirmed?
    assert_has_stream "chat_#{@session.id}"
  end

  test "subscribes and creates session when none specified" do
    subscribe
    assert subscription.confirmed?
  end

  test "send_message creates user message and broadcasts" do
    subscribe session_id: @session.id

    assert_difference -> { @session.messages.count }, 1 do
      perform :send_message, content: "test message"
    end

    message = @session.messages.order(:created_at).last
    assert_equal "user", message.role
    assert_equal "test message", message.content
  end

  test "send_message broadcasts to channel" do
    subscribe session_id: @session.id

    assert_broadcasts("chat_#{@session.id}", 1) do
      perform :send_message, content: "broadcast test"
    end
  end

  test "respond creates assistant message" do
    subscribe session_id: @session.id

    assert_difference -> { @session.messages.count }, 1 do
      perform :respond, content: "assistant reply"
    end

    message = @session.messages.order(:created_at).last
    assert_equal "assistant", message.role
    assert_equal "assistant reply", message.content
  end

  test "respond broadcasts to channel" do
    subscribe session_id: @session.id

    assert_broadcasts("chat_#{@session.id}", 1) do
      perform :respond, content: "hello from plugin"
    end
  end
end
