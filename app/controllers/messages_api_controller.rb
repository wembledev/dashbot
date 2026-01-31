# frozen_string_literal: true

class MessagesApiController < ActionController::API
  before_action :authenticate_token!

  # POST /api/messages/respond — Send an assistant message
  def respond
    session = find_or_create_session

    message = session.messages.create!(
      role: "assistant",
      content: params[:content],
      metadata: params[:metadata]&.to_unsafe_h
    )
    session.touch

    ActionCable.server.broadcast("chat_#{session.id}", {
      type: "message",
      message: {
        id: message.id,
        role: message.role,
        content: message.content,
        metadata: message.metadata,
        created_at: message.created_at.iso8601
      }
    })

    render json: { ok: true, message_id: message.id }
  end

  private

  def find_or_create_session
    user = User.first
    profile = user.default_profile
    user.chat_sessions.find_or_create_by!(profile: profile) { |s| s.title = "Chat" }
  end

  def authenticate_token!
    token = request.headers["Authorization"]&.delete_prefix("Bearer ")&.strip
    expected = ENV.fetch("DASHBOT_API_TOKEN", "")

    unless token.present? && expected.present? && ActiveSupport::SecurityUtils.secure_compare(token, expected)
      render json: { error: "Unauthorized" }, status: :unauthorized
    end
  end
end
