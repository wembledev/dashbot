# frozen_string_literal: true

require "test_helper"

class SettingTest < ActiveSupport::TestCase
  test "get returns value for existing setting" do
    profile = profiles(:driver)
    assert_equal "dark", Setting.get(profile, "theme")
  end

  test "get returns nil for missing setting" do
    profile = profiles(:driver)
    assert_nil Setting.get(profile, "nonexistent")
  end

  test "set creates a new setting" do
    profile = profiles(:driver)
    assert_difference "Setting.count", 1 do
      Setting.set(profile, "new_key", "new_value")
    end
    assert_equal "new_value", Setting.get(profile, "new_key")
  end

  test "set updates an existing setting" do
    profile = profiles(:driver)
    assert_no_difference "Setting.count" do
      Setting.set(profile, "theme", "light")
    end
    assert_equal "light", Setting.get(profile, "theme")
  end

  test "global setting with nil settable" do
    Setting.set(nil, "app_name", "Dashbot")
    assert_equal "Dashbot", Setting.get(nil, "app_name")
  end

  test "same key scoped to different settables" do
    user = users(:admin)
    profile = profiles(:driver)
    Setting.set(nil, "theme", "system")
    Setting.set(user, "theme", "light")
    Setting.set(profile, "theme", "dark")

    assert_equal "system", Setting.get(nil, "theme")
    assert_equal "light", Setting.get(user, "theme")
    assert_equal "dark", Setting.get(profile, "theme")
  end
end
