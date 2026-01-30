# frozen_string_literal: true

require "test_helper"

class UserTest < ActiveSupport::TestCase
  test "has_secure_password authenticates with correct password" do
    user = User.create!(password: "testpass123")
    assert user.authenticate("testpass123")
    assert_not user.authenticate("wrong")
  end

  test "has many profiles" do
    user = users(:admin)
    assert_respond_to user, :profiles
    assert_includes user.profiles, profiles(:driver)
  end

  test "has many chat sessions" do
    user = users(:admin)
    assert_respond_to user, :chat_sessions
    assert_includes user.chat_sessions, chat_sessions(:navigation_chat)
  end

  test "destroying user destroys profiles" do
    user = User.create!(password: "testpass123")
    user.profiles.create!(name: "Test")
    assert_difference "Profile.count", -1 do
      user.destroy
    end
  end
end
