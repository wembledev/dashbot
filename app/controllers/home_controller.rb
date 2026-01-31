# frozen_string_literal: true

class HomeController < ApplicationController
  def index
    session = current_user.chat_sessions
      .joins(:profile)
      .where(profile: current_profile)
      .recent
      .first_or_create!(
        profile: current_profile,
        title: "Chat"
      )

    messages = session.messages.order(:created_at).map do |m|
      { id: m.id, role: m.role, content: m.content, metadata: m.metadata, created_at: m.created_at.iso8601 }
    end

    render inertia: "home/index", props: {
      chat_session_id: session.id,
      messages: messages
    }
  end

  def clear_messages
    session = current_user.chat_sessions
      .joins(:profile)
      .where(profile: current_profile)
      .recent
      .first

    if session
      session.messages.destroy_all
      ActionCable.server.broadcast("chat_#{session.id}", { type: "clear" })
    end

    redirect_to dashboard_path
  end
end
