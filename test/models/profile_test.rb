# frozen_string_literal: true

require "test_helper"

class ProfileTest < ActiveSupport::TestCase
  test "belongs to user" do
    profile = profiles(:driver)
    assert_equal users(:admin), profile.user
  end

  test "validates name presence" do
    profile = Profile.new(user: users(:admin), name: "")
    assert_not profile.valid?
    assert_includes profile.errors[:name], "can't be blank"
  end

  test "has many chat sessions" do
    profile = profiles(:driver)
    assert_respond_to profile, :chat_sessions
  end

  test "destroying profile destroys chat sessions" do
    user = User.create!(password: "testpass123")
    profile = user.profiles.create!(name: "Temp")
    profile.chat_sessions.create!(user: user, title: "Chat")
    assert_difference "ChatSession.count", -1 do
      profile.destroy
    end
  end
end
