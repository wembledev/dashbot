# frozen_string_literal: true

ENV["RAILS_ENV"] ||= "test"
require_relative "../config/environment"
require "rails/test_help"

# Stub Vite asset helpers in test — no dev server or build manifest available.
ActiveSupport.on_load(:action_view) do
  module ::ViteTestStubs
    def vite_client_tag = ""
    def vite_typescript_tag(*) = ""
    def vite_react_refresh_tag = ""
  end
  prepend ViteTestStubs
end

module ActiveSupport
  class TestCase
    parallelize(workers: :number_of_processors)
    fixtures :all
  end
end

module SignInHelper
  def sign_in_as(user, profile = nil)
    profile ||= user.profiles.first
    post "/test_sign_in", params: { user_id: user.id, profile_id: profile&.id }
  end
end

class ActionDispatch::IntegrationTest
  include SignInHelper
end
