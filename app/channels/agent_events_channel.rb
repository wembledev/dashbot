# frozen_string_literal: true

class AgentEventsChannel < ApplicationCable::Channel
  def subscribed
    stream_from "agent_events"
  end

  def unsubscribed
    # No cleanup needed
  end
end
