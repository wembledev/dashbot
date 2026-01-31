# frozen_string_literal: true

require "test_helper"

class QrTokenTest < ActiveSupport::TestCase
  test "create_for_session generates token with session_id" do
    qr = QrToken.create_for_session("test-session-id")
    assert qr.persisted?
    assert qr.token.present?
    assert_equal "test-session-id", qr.session_id
    assert_not qr.used?
    assert qr.expires_at > Time.current
  end

  test "find_pending returns unexpired unused token" do
    qr = QrToken.create_for_session("sess")
    assert_equal qr, QrToken.find_pending(qr.token)
  end

  test "find_pending returns nil for used token" do
    qr = QrToken.create_for_session("sess")
    qr.update!(used: true)
    assert_nil QrToken.find_pending(qr.token)
  end

  test "find_pending returns nil for expired token" do
    qr = QrToken.create_for_session("sess")
    qr.update!(expires_at: 1.minute.ago)
    assert_nil QrToken.find_pending(qr.token)
  end

  test "claim sets user and marks used" do
    user = users(:admin)
    qr = QrToken.create_for_session("sess")
    qr.claim!(user)
    assert qr.used?
    assert_equal user, qr.user
    assert qr.claimed?
  end

  test "owned_by_session checks session_id" do
    qr = QrToken.create_for_session("my-session")
    assert qr.owned_by_session?("my-session")
    assert_not qr.owned_by_session?("other-session")
  end

  test "to_qr_png_data_uri returns base64 PNG data URI" do
    qr = QrToken.create_for_session("sess")
    uri = qr.to_qr_png_data_uri(url: "http://localhost:3000/login/#{qr.token}")
    assert uri.start_with?("data:image/png;base64,")
    assert uri.length > 100
  end

  test "token uses urlsafe_base64" do
    qr = QrToken.create_for_session("sess")
    assert_match(/\A[A-Za-z0-9_-]+\z/, qr.token)
  end
end
