# frozen_string_literal: true

require "test_helper"

class AuthenticationTest < ActionDispatch::IntegrationTest
  test "unauthenticated request redirects to login" do
    get dashboard_path
    assert_redirected_to login_path
  end

  test "authenticated request proceeds" do
    sign_in_as(users(:admin))
    get dashboard_path
    assert_response :success
  end

  test "sign_in_as sets current user and profile" do
    user = users(:admin)
    profile = profiles(:driver)
    sign_in_as(user, profile)

    get dashboard_path
    assert_response :success
  end

  test "logout clears session so subsequent requests redirect" do
    sign_in_as(users(:admin))
    get dashboard_path
    assert_response :success

    delete logout_path
    assert_redirected_to root_path

    get dashboard_path
    assert_redirected_to login_path
  end
end
