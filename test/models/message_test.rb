# frozen_string_literal: true

require "test_helper"

class MessageTest < ActiveSupport::TestCase
  test "belongs to chat session" do
    message = messages(:user_greeting)
    assert_equal chat_sessions(:navigation_chat), message.chat_session
  end

  test "validates content presence" do
    message = Message.new(chat_session: chat_sessions(:navigation_chat), role: "user", content: "")
    assert_not message.valid?
    assert_includes message.errors[:content], "can't be blank"
  end
end
