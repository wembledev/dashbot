# frozen_string_literal: true

class ApplicationController < ActionController::Base
  include Authentication

  # Keep modern-browser guard, but don't block QR auth handoff routes because
  # scanner/in-app browsers can report older user agents.
  allow_browser versions: :modern, block: :handle_outdated_browser

  private

  def handle_outdated_browser
    return if controller_path == "auth" && %w[index qr qr_status login_form login].include?(action_name)

    render file: Rails.root.join("public/406-unsupported-browser.html"), layout: false, status: :not_acceptable
  end
end
