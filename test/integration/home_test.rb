# frozen_string_literal: true

require "test_helper"

class HomeTest < ActionDispatch::IntegrationTest
  test "GET /dashboard renders Inertia page when authenticated" do
    sign_in_as(users(:admin))
    get dashboard_path
    assert_response :success

    match = response.body.match(%r{<script[^>]*data-page[^>]*>(.+?)</script>}m)
    assert match, "Expected Inertia page data in response body"

    page = JSON.parse(match[1])
    assert_equal "home/index", page["component"]
  end

  test "GET /dashboard passes chat_session_id and messages props" do
    sign_in_as(users(:admin))
    get dashboard_path
    assert_response :success

    match = response.body.match(%r{<script[^>]*data-page[^>]*>(.+?)</script>}m)
    page = JSON.parse(match[1])
    props = page["props"]

    assert props.key?("chat_session_id"), "Expected chat_session_id prop"
    assert props.key?("messages"), "Expected messages prop"
    assert_kind_of Integer, props["chat_session_id"]
    assert_kind_of Array, props["messages"]
  end

  test "GET /dashboard redirects to login when not authenticated" do
    get dashboard_path
    assert_redirected_to login_path
  end

  test "GET / redirects to /dashboard" do
    get root_path
    assert_response :redirect
  end
end
