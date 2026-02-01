# frozen_string_literal: true

class Api::SessionsController < ActionController::API
  include ApiAuthentication

  before_action :authenticate_token!

  # GET /api/sessions
  # Returns current sessions from cached status data
  def index
    cached = Rails.cache.read("openclaw_status")
    sessions = cached&.dig("sessions") || cached&.dig(:sessions) || []

    render json: { sessions: sessions }
  end

  # DELETE /api/sessions/:id
  # Requests session termination via ActionCable → plugin
  def destroy
    session_key = params[:id]

    # Don't allow closing the main session via API
    if session_key.match?(/agent:\w+:main$/)
      render json: { error: "Cannot close main session" }, status: :forbidden
      return
    end

    # Send kill request to plugin via ActionCable
    ActionCable.server.broadcast("plugin_commands", {
      type: "session_kill",
      session_key: session_key
    })

    render json: { ok: true, message: "Session close requested", session_key: session_key }
  end
end
