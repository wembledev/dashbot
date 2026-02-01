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
    event = AgentEvent.new(event_params)

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
