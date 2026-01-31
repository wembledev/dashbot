# frozen_string_literal: true

require "test_helper"

class SettingsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:admin)
  end

  test "GET /settings returns 200 when authenticated" do
    sign_in_as(@user)
    get "/settings"
    assert_response :success
  end

  test "GET /settings redirects to login when not authenticated" do
    get "/settings"
    assert_redirected_to login_path
  end
end
