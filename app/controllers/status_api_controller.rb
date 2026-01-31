# frozen_string_literal: true

class StatusApiController < ActionController::API
  include ApiAuthentication

  before_action :authenticate_token!

  def update
    # Store the entire status payload in Rails cache
    # The plugin sends pre-formatted StatusData matching the frontend shape
    status_data = params.except(:controller, :action, :format, :status_api).to_unsafe_h

    Rails.cache.write("openclaw_status", status_data, expires_in: 5.minutes)

    render json: { ok: true }, status: :ok
  end
end
