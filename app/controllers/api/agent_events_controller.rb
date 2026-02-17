# frozen_string_literal: true

class Api::AgentEventsController < ActionController::API
  include ApiAuthentication

  before_action :authenticate_token!

  # GET /api/agent/events
  # Returns recent agent events, paginated
  def index
    limit = [ params.fetch(:limit, 50).to_i, 100 ].min
    events = AgentEvent.recent.limit(limit)

    # Optional: filter by type
    events = events.where(event_type: params[:type]) if params[:type].present?

    # Optional: since timestamp for incremental updates
    events = events.since(Time.parse(params[:since])) if params[:since].present?

    render json: {
      events: events.map(&:as_broadcast),
      total: AgentEvent.count
    }
  end

  # POST /api/agent/events
  # Log a new agent event (called by OpenClaw plugin/agent)
  def create
    attrs = event_params.to_h

    # Prevent duplicate "spawned" events for the same session key.
    if attrs["event_type"] == "spawned" && attrs["session_key"].present?
      existing = AgentEvent.find_by(event_type: "spawned", session_key: attrs["session_key"])
      if existing
        return render json: { ok: true, deduped: true, event: existing.as_broadcast }, status: :ok
      end
    end

    # If the producer provides an authoritative spawn timestamp, preserve it.
    spawned_at_ms = attrs.dig("metadata", "spawned_at")
    if attrs["event_type"] == "spawned" && spawned_at_ms.present?
      begin
        t = Time.at(spawned_at_ms.to_f / 1000.0).utc
        attrs["created_at"] = t
        attrs["updated_at"] = t
      rescue StandardError
        # Fall back to default timestamps.
      end
    end

    event = AgentEvent.new(attrs)

    if event.save
      render json: { ok: true, event: event.as_broadcast }, status: :created
    else
      render json: { error: event.errors.full_messages.join(", ") }, status: :unprocessable_entity
    end
  end

  private

  def event_params
    params.permit(:event_type, :agent_label, :session_key, :model, :description, metadata: {})
  end
end
