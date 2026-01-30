# frozen_string_literal: true

require "test_helper"

# Force ActionView to load so ViteTestStubs is defined
ActionView::Base

# System tests need real Vite-built assets to render Inertia/React pages
# in the browser, so remove the stubs that test_helper.rb sets up.
ViteTestStubs.remove_method :vite_client_tag
ViteTestStubs.remove_method :vite_typescript_tag
ViteTestStubs.remove_method :vite_react_refresh_tag

class ApplicationSystemTestCase < ActionDispatch::SystemTestCase
  driven_by :selenium, using: :headless_chrome
end
