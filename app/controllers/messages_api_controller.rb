# frozen_string_literal: true

class MessagesApiController < ActionController::API
  include ApiAuthentication

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
end
