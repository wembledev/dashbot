# frozen_string_literal: true

require "test_helper"

class HomeTest < ActionDispatch::IntegrationTest
  test "GET / renders Inertia page" do
    get root_path
    assert_response :success

    match = response.body.match(%r{<script[^>]*data-page[^>]*>(.+?)</script>}m)
    assert match, "Expected Inertia page data in response body"

    page = JSON.parse(match[1])
    assert_equal "home/index", page["component"]
  end
end
