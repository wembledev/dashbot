# frozen_string_literal: true

class StatusController < ApplicationController
  def index
    render inertia: "status/index", props: {
      status_data: fetch_status_data,
      initial_events: AgentEvent.recent.limit(50).map(&:as_broadcast)
    }
  end

  # JSON polling endpoint
  def poll
    render json: fetch_status_data
  end

  # JSON events endpoint (cookie-auth for dashboard)
  def events
    limit = [ params.fetch(:limit, 50).to_i, 100 ].min
    events = AgentEvent.recent.limit(limit)
    events = events.since(Time.parse(params[:since])) if params[:since].present?

    render json: { events: events.map(&:as_broadcast) }
  end

  # Session keep-alive endpoint
  def keepalive
    head :ok
  end

  # DELETE /status/sessions/:key - close a session (cookie-auth for dashboard users)
  def close_session
    session_key = params[:key]

    # Don't allow closing the main session
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

  private

  def fetch_status_data
    # Read pre-formatted status data pushed by the OpenClaw dashbot plugin
    cached = Rails.cache.read("openclaw_status")

    if cached.present?
      cached.deep_symbolize_keys
    else
      empty_status_data
    end
  end

  def empty_status_data
    {
      agent_status: {
        running: false,
        session_count: 0,
        main_session_age: "unknown",
        main_model: "unknown"
      },
      token_burn: {
        main_tokens: "0/0",
        main_context_percent: 0,
        total_sessions: 0,
        model: "unknown"
      },
      tasks: {
        cron_jobs: [],
        pending_count: 0,
        next_job: nil,
        cron_health: "healthy",
        cron_errors: []
      },
      memory: {
        backend: "openclaw",
        file_count: 0,
        vector_count: 0,
        index_size: "—",
        updated: "waiting for data...",
        collections: [],
        chunk_count: 0,
        dirty: false,
        sources: "waiting for data...",
        vector_ready: false,
        fts_ready: false,
        cache_count: 0
      },
      session_health: {
        uptime: "unknown",
        model: "unknown",
        context_percent: 0,
        tokens: "0/0",
        session_key: "unknown"
      },
      sessions: [],
      fetched_at: Time.current.strftime("%Y-%m-%d %H:%M:%S %Z")
    }
  end
end
