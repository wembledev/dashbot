# frozen_string_literal: true

require "application_system_test_case"

class CriticalPathsTest < ApplicationSystemTestCase
  test "visit login page" do
    visit login_path

    assert_text "DashBot"
    assert_text "Scan with your phone"
  end

  test "login via QR token" do
    token = QrToken.create!(
      token: "test-system-token",
      expires_at: 5.minutes.from_now,
      session_id: "test-session"
    )

    visit qr_login_path(token.token)

    assert_text "Enter Password"

    fill_in "Password", with: "dashbot123"
    click_on "Login"

    assert_text "You're In!"
  end

  test "unauthenticated redirects to login" do
    visit dashboard_path

    assert_current_path login_path
    assert_text "DashBot"
  end
end
