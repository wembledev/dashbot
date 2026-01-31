# frozen_string_literal: true

class ChatChannel < ApplicationCable::Channel
  def subscribed
    @chat_session = find_or_create_session
    stream_from "chat_#{@chat_session.id}"

    # All connections listen for plugin commands (simpler than detection)
    # Only plugin will act on status_requested/status_stopped
    stream_from "plugin_commands"
  end

  def send_message(data)
    message = @chat_session.messages.create!(
      role: "user",
      content: data["content"]
    )
    @chat_session.touch
    broadcast_message(message)
  end

  def respond(data)
    message = @chat_session.messages.create!(
      role: "assistant",
      content: data["content"],
      metadata: data["metadata"]
    )
    @chat_session.touch
    broadcast_message(message)
  end

  # Receive status data from plugin and broadcast to StatusChannel subscribers.
  # Also cache for initial page loads and manual refresh.
  def send_status(data)
    status_data = data["status_data"]
    StatusChannel.broadcast_status(status_data)
    Rails.cache.write("openclaw_status", status_data, expires_in: 5.minutes)
  end

  private

  def broadcast_message(message)
    ActionCable.server.broadcast("chat_#{@chat_session.id}", {
      type: "message",
      message: serialize_message(message)
    })
  end

  def serialize_message(message)
    {
      id: message.id,
      role: message.role,
      content: message.content,
      metadata: message.metadata,
      created_at: message.created_at.iso8601
    }
  end

  def find_or_create_session
    profile = current_user.default_profile
    session_id = params[:session_id]

    if session_id.present?
      current_user.chat_sessions.find(session_id)
    else
      current_user.chat_sessions.find_or_create_by!(profile: profile) do |s|
        s.title = "Chat"
      end
    end
  end

  def chat_session_id
    @chat_session.id
  end
end
