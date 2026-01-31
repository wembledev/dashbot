# frozen_string_literal: true

class StatusController < ApplicationController
  def index
    render inertia: "status/index", props: {
      status_data: fetch_status_data
    }
  end

  # JSON polling endpoint
  def poll
    render json: fetch_status_data
  end

  # Session keep-alive endpoint
  def keepalive
    head :ok
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
