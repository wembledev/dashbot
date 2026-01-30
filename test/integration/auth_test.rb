# frozen_string_literal: true

require "test_helper"

class AuthTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:admin)
  end

  # --- GET /login ---

  test "GET /login renders QR login page when not authenticated" do
    get login_path
    assert_response :success
  end

  test "GET /login redirects to dashboard when already authenticated" do
    sign_in_as(@user)
    get login_path
    assert_redirected_to dashboard_path
  end

  # --- GET /qr ---

  test "GET /qr returns QR code data" do
    get qr_path
    assert_response :success
    body = JSON.parse(response.body)
    assert body["token"].present?
    assert body["qr_data"].start_with?("data:image/png;base64,")
  end

  # --- GET /qr/:token/status ---

  test "GET /qr/:token/status returns not logged in for unclaimed token" do
    qr = QrToken.create_for_session("other-session")
    get qr_status_path(qr.token)
    body = JSON.parse(response.body)
    assert_not body["logged_in"]
    assert body["valid"]
  end

  test "GET /qr/:token/status returns not logged in for wrong session" do
    qr = QrToken.create_for_session("different-session")
    qr.claim!(@user)
    get qr_status_path(qr.token)
    body = JSON.parse(response.body)
    assert_not body["logged_in"]
  end

  # --- GET /qr/:token ---

  test "GET /qr/:token renders login form page" do
    qr = QrToken.create_for_session("sess")
    get qr_login_path(qr.token)
    assert_response :success
  end

  # --- POST /login/:token ---

  test "POST /login/:token succeeds with valid token and password" do
    qr = QrToken.create_for_session("sess")
    post auth_login_path(qr.token), params: { password: "dashbot123" }, as: :json
    assert_response :success
    assert qr.reload.claimed?
  end

  test "POST /login/:token rejects invalid password" do
    qr = QrToken.create_for_session("sess")
    post auth_login_path(qr.token), params: { password: "wrong" }, as: :json
    assert_response :unauthorized
  end

  test "POST /login/:token rejects expired token" do
    qr = QrToken.create_for_session("sess")
    qr.update!(expires_at: 1.minute.ago)
    post auth_login_path(qr.token), params: { password: "dashbot123" }, as: :json
    assert_response :unauthorized
  end

  # --- DELETE /logout ---

  test "DELETE /logout clears session and redirects" do
    sign_in_as(@user)
    delete logout_path
    assert_redirected_to root_path
  end
end
