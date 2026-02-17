# frozen_string_literal: true

require "json"
require "open3"
require "timeout"

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

  # DELETE /status/sessions/:key - close/archive a session (cookie-auth for dashboard users)
  def close_session
    session_key = params[:key].to_s.strip
    return render json: { error: "Session key required" }, status: :unprocessable_entity if session_key.blank?

    if main_session_key?(session_key)
      render json: { error: "Cannot close main session" }, status: :forbidden
      return
    end

    out, err, status = gateway_call("sessions.delete", {
      key: session_key,
      deleteTranscript: true
    })

    unless status.success?
      return render json: {
        error: err.presence || out.presence || "Failed to close session"
      }, status: :unprocessable_entity
    end

    payload = JSON.parse(out.presence || "{}")
    unless payload["ok"] == true
      return render json: {
        error: payload["error"].presence || "Failed to close session",
        payload: payload
      }, status: :unprocessable_entity
    end

    unless payload["deleted"] == true
      return render json: {
        error: "Session was not deleted by gateway",
        payload: payload
      }, status: :unprocessable_entity
    end

    render json: {
      ok: true,
      session_key: session_key,
      deleted: true,
      archived: payload["archived"] || []
    }
  rescue Timeout::Error
    render json: { error: "Session close timed out" }, status: :request_timeout
  rescue JSON::ParserError
    render json: { error: "Session close returned invalid JSON" }, status: :unprocessable_entity
  rescue StandardError => e
    render json: { error: e.message }, status: :unprocessable_entity
  end

  private

  def main_session_key?(session_key)
    return true if session_key == "main"

    parts = session_key.split(":")
    parts.length == 3 && parts.first == "agent" && parts.last == "main"
  end

  def gateway_call(method, params)
    out = +""
    err = +""
    status = nil

    Timeout.timeout(20) do
      env = {
        "PATH" => "#{File.expand_path("~/.bun/bin")}:#{ENV.fetch("PATH", "")}" 
      }
      out, err, status = Open3.capture3(
        env,
        "openclaw", "gateway", "call", method,
        "--json",
        "--params", params.to_json
      )
    end

    [out.strip, err.strip, status]
  end

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
