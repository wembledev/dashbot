# frozen_string_literal: true

require "test_helper"

class AuthControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:admin)
  end

  test "login page accessible" do
    get "/login"
    assert_response :success
  end

  test "logout clears session" do
    sign_in_as(@user)

    # Verify user is signed in
    get "/dashboard"
    assert_response :success

    # Logout
    delete "/logout"
    assert_redirected_to root_path

    # Verify session is cleared - should redirect to login
    get "/dashboard"
    assert_redirected_to login_path
  end

  test "authenticated user redirected from login to dashboard" do
    sign_in_as(@user)

    get "/login"
    assert_redirected_to dashboard_path
  end

  test "unauthenticated user can access login page" do
    get "/login"
    assert_response :success
  end

  test "qr endpoint creates token and returns JSON" do
    get "/qr"
    assert_response :success

    json = response.parsed_body
    assert json.key?("token")
    assert json.key?("qr_data")
    assert json.key?("expires_at")
    assert json["qr_data"].start_with?("data:image/png;base64,")
  end

  test "qr_status returns logged_in false for unclaimed token" do
    # Create a token first
    get "/qr"
    token = response.parsed_body["token"]

    get "/qr/#{token}/status"
    assert_response :success

    json = response.parsed_body
    assert_equal false, json["logged_in"]
    assert_equal true, json["valid"]
  end

  test "login with valid credentials claims token" do
    # Create a QR session
    get "/qr"
    token = response.parsed_body["token"]

    # Attempt login
    post "/login/#{token}",
      params: { password: "dashbot123" },
      as: :json

    assert_response :success
    json = response.parsed_body
    assert_equal true, json["success"]
  end

  test "login with invalid password returns unauthorized" do
    get "/qr"
    token = response.parsed_body["token"]

    post "/login/#{token}",
      params: { password: "wrong-password" },
      as: :json

    assert_response :unauthorized
    json = response.parsed_body
    assert_equal "Invalid password", json["error"]
  end

  test "login with invalid token returns unauthorized" do
    post "/login/invalid-token",
      params: { password: "password123" },
      as: :json

    assert_response :unauthorized
    json = response.parsed_body
    assert_equal "Invalid or expired token", json["error"]
  end

  test "logout redirects to root path" do
    sign_in_as(@user)

    delete "/logout"
    assert_redirected_to root_path
  end

  test "qr session is created when accessing qr endpoint" do
    get "/qr"
    assert_response :success

    # Verify subsequent calls to qr_status work (implicitly testing session)
    token = response.parsed_body["token"]
    get "/qr/#{token}/status"
    assert_response :success
  end

  test "login_form renders with token parameter" do
    get "/login/qr"
    token = response.parsed_body["token"]

    get "/login/#{token}"
    assert_response :success
  end
end
