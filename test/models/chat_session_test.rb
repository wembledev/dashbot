# frozen_string_literal: true

require "test_helper"

class ChatSessionTest < ActiveSupport::TestCase
  test "belongs to user and profile" do
    session = chat_sessions(:navigation_chat)
    assert_equal users(:admin), session.user
    assert_equal profiles(:driver), session.profile
  end

  test "validates title presence" do
    session = ChatSession.new(user: users(:admin), profile: profiles(:driver), title: "")
    assert_not session.valid?
    assert_includes session.errors[:title], "can't be blank"
  end

  test "has many messages" do
    session = chat_sessions(:navigation_chat)
    assert_includes session.messages, messages(:user_greeting)
  end

  test "destroying session destroys messages" do
    session = chat_sessions(:navigation_chat)
    assert_difference "Message.count", -1 do
      session.destroy
    end
  end

  test "recent scope orders by updated_at desc" do
    older = ChatSession.create!(user: users(:admin), profile: profiles(:driver), title: "Old", updated_at: 1.day.ago)
    newer = ChatSession.create!(user: users(:admin), profile: profiles(:driver), title: "New", updated_at: Time.current)
    results = ChatSession.recent
    assert results.index(newer) < results.index(older)
  end

  test "message_count returns count of messages" do
    session = chat_sessions(:navigation_chat)
    assert_equal session.messages.count, session.message_count
  end
end
