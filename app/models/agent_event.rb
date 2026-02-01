# frozen_string_literal: true

class AgentEvent < ApplicationRecord
  VALID_EVENT_TYPES = %w[
    spawned completed failed timeout
    cron_run cron_failed
    session_opened session_closed
    model_changed
  ].freeze

  validates :event_type, presence: true, inclusion: { in: VALID_EVENT_TYPES }

  scope :recent, -> { order(created_at: :desc).limit(100) }
  scope :since, ->(time) { where("created_at > ?", time) }

  # Broadcast to ActionCable after creation
  after_create_commit :broadcast_event

  # Clean up old events (keep last 500)
  def self.cleanup!(keep: 500)
    cutoff = order(created_at: :desc).offset(keep).pick(:id)
    where("id <= ?", cutoff).delete_all if cutoff
  end

  def duration_seconds
    metadata&.dig("duration_seconds")
  end

  def result
    metadata&.dig("result")
  end

  def error_message
    metadata&.dig("error")
  end

  def as_broadcast
    {
      id: id,
      event_type: event_type,
      agent_label: agent_label,
      session_key: session_key,
      model: model,
      description: description,
      metadata: metadata,
      created_at: created_at.iso8601
    }
  end

  private

  def broadcast_event
    ActionCable.server.broadcast("agent_events", {
      type: "new_event",
      event: as_broadcast
    })
  end
end
