# frozen_string_literal: true

require "fileutils"
require "open3"
require "timeout"

class SettingsApiController < ApplicationController
  MEMORY_CAPTURE_PATH = File.expand_path("~/.openclaw/workspace/memory/quick-captures.md")

  ALLOWED_MODELS = [
    "openai-codex/gpt-5.3-codex",
    "anthropic/claude-opus-4-6",
    "anthropic/claude-sonnet-4-5",
    "openrouter/minimax/minimax-m2.5",
    "openrouter/x-ai/grok-4.1-fast"
  ].freeze

  # POST /api/settings/model
  def update_model
    model = params[:model].to_s.strip
    restart = ActiveModel::Type::Boolean.new.cast(params[:restart])

    unless ALLOWED_MODELS.include?(model)
      return render json: { error: "Unsupported model" }, status: :unprocessable_entity
    end

    out, err, status = run_command(["openclaw", "config", "set", "agents.defaults.model.primary", model], timeout: 30)
    unless status.success?
      return render json: { error: err.presence || out.presence || "Failed to update model" }, status: :unprocessable_entity
    end

    if restart
      rout, rerr, rstatus = run_command(["openclaw", "gateway", "restart"], timeout: 45)
      unless rstatus.success?
        return render json: {
          error: rerr.presence || rout.presence || "Model saved but gateway restart failed",
          model: model,
          restarted: false
        }, status: :unprocessable_entity
      end
    end

    render json: { ok: true, model: model, restarted: restart }
  rescue Timeout::Error
    render json: { error: "Request timed out while applying model" }, status: :request_timeout
  rescue StandardError => e
    render json: { error: e.message }, status: :unprocessable_entity
  end

  # POST /api/memory/save
  def save_memory
    note = params[:note].to_s.strip
    return render json: { error: "Note cannot be empty" }, status: :unprocessable_entity if note.blank?

    FileUtils.mkdir_p(File.dirname(MEMORY_CAPTURE_PATH))

    stamp = Time.current.in_time_zone("America/Detroit").strftime("%Y-%m-%d %H:%M:%S %Z")
    File.open(MEMORY_CAPTURE_PATH, "a") do |f|
      f.puts("- [#{stamp}] #{note}")
    end

    render json: { ok: true, path: MEMORY_CAPTURE_PATH }
  rescue StandardError => e
    render json: { error: e.message }, status: :unprocessable_entity
  end

  # POST /api/memory/reindex
  def reindex_memory
    mode = params[:mode].to_s.strip

    cmd = if mode == "openclaw"
      ["openclaw", "memory", "reindex"]
    else
      ["qmd", "update"]
    end

    out, err, status = run_command(cmd, timeout: 120)
    unless status.success?
      return render json: { error: err.presence || out.presence || "Reindex failed" }, status: :unprocessable_entity
    end

    render json: { ok: true, mode: (mode.presence || "qmd") }
  rescue Timeout::Error
    render json: { error: "Memory reindex timed out" }, status: :request_timeout
  rescue StandardError => e
    render json: { error: e.message }, status: :unprocessable_entity
  end

  private

  def run_command(argv, timeout:)
    out = +""
    err = +""
    status = nil

    Timeout.timeout(timeout) do
      env = {
        "PATH" => "#{File.expand_path("~/.bun/bin")}:#{ENV.fetch("PATH", "")}" 
      }
      out, err, status = Open3.capture3(env, *argv)
    end

    [out.strip, err.strip, status]
  end
end
