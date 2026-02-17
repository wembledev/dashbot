# frozen_string_literal: true

require "fileutils"
require "json"
require "open3"
require "timeout"

class SettingsApiController < ApplicationController
  MEMORY_CAPTURE_PATH = File.expand_path("~/.openclaw/workspace/memory/quick-captures.md")
  OPENCLAW_CONFIG_PATH = File.expand_path("~/.openclaw/openclaw.json")

  # GET /api/settings/model-config
  def model_config
    config = load_openclaw_config
    render json: {
      ok: true,
      config: build_model_config_payload(config)
    }
  rescue StandardError => e
    render json: { error: "Failed to load model config: #{e.message}" }, status: :unprocessable_entity
  end

  # POST /api/settings/model-config
  def update_model_config
    config = load_openclaw_config

    primary = normalize_model(params[:primary]) || config.dig("agents", "defaults", "model", "primary").to_s
    fallbacks = normalize_model_list(params[:fallbacks])
    fallbacks = Array(config.dig("agents", "defaults", "model", "fallbacks")).map(&:to_s) if fallbacks.empty?

    subagent_model = normalize_model(params[:subagentModel]) || config.dig("agents", "defaults", "subagents", "model").to_s
    embedding_model = normalize_model(params[:embeddingModel]) || config.dig("agents", "defaults", "memorySearch", "model").to_s
    memory_fallback = params[:memoryFallback].to_s.strip
    memory_fallback = config.dig("agents", "defaults", "memorySearch", "fallback").to_s if memory_fallback.blank?

    requested_agent_models = normalize_agent_models(params[:agents])
    requested_cron_models = normalize_cron_models(params[:cronModels])

    restart = ActiveModel::Type::Boolean.new.cast(params[:restart])
    ensure_phone_access = ActiveModel::Type::Boolean.new.cast(params[:ensurePhoneAccess])

    errors = []
    changed = []

    apply_config_set("agents.defaults.model.primary", primary, changed: changed, errors: errors,
      current_value: config.dig("agents", "defaults", "model", "primary"), json: true)

    apply_config_set("agents.defaults.model.fallbacks", fallbacks, changed: changed, errors: errors,
      current_value: Array(config.dig("agents", "defaults", "model", "fallbacks")), json: true)

    apply_config_set("agents.defaults.subagents.model", subagent_model, changed: changed, errors: errors,
      current_value: config.dig("agents", "defaults", "subagents", "model"), json: true)

    apply_config_set("agents.defaults.memorySearch.model", embedding_model, changed: changed, errors: errors,
      current_value: config.dig("agents", "defaults", "memorySearch", "model"), json: true)

    apply_config_set("agents.defaults.memorySearch.fallback", memory_fallback, changed: changed, errors: errors,
      current_value: config.dig("agents", "defaults", "memorySearch", "fallback"), json: true)

    Array(config.dig("agents", "list")).each_with_index do |agent, index|
      id = agent["id"].to_s
      next unless requested_agent_models.key?(id)

      requested_model = requested_agent_models[id]
      current_model = agent["model"].to_s
      next if requested_model.blank? || requested_model == current_model

      path = "agents.list[#{index}].model"
      apply_config_set(path, requested_model, changed: changed, errors: errors,
        current_value: current_model, json: true, label: "agent:#{id}")
    end

    apply_cron_model_updates(requested_cron_models, changed: changed, errors: errors)

    unless errors.empty?
      return render json: {
        error: "Failed to apply some model updates",
        details: errors,
        changed: changed
      }, status: :unprocessable_entity
    end

    phone_access_result = nil

    if restart
      rout, rerr, rstatus = run_command(["openclaw", "gateway", "restart"], timeout: 90)
      unless rstatus.success?
        return render json: {
          error: rerr.presence || rout.presence || "Settings saved but gateway restart failed",
          changed: changed,
          restarted: false
        }, status: :unprocessable_entity
      end

      if ensure_phone_access
        phone_access_result = ensure_dashbot_phone_access
      end
    end

    render json: {
      ok: true,
      changed: changed,
      restarted: restart,
      phoneAccess: phone_access_result
    }
  rescue Timeout::Error
    render json: { error: "Request timed out while applying model config" }, status: :request_timeout
  rescue StandardError => e
    render json: { error: e.message }, status: :unprocessable_entity
  end

  # Backward-compatible endpoint used by earlier UI versions.
  # POST /api/settings/model
  def update_model
    params[:primary] = params[:model]
    params[:ensurePhoneAccess] = true if params[:ensurePhoneAccess].nil?
    update_model_config
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

  def load_openclaw_config
    JSON.parse(File.read(OPENCLAW_CONFIG_PATH))
  end

  def build_model_config_payload(config)
    agents = Array(config.dig("agents", "list")).map do |agent|
      {
        id: agent["id"].to_s,
        model: agent["model"].to_s
      }
    end

    cron_models = fetch_cron_models

    model_registry = config.dig("agents", "defaults", "models")
    enabled_models = Array(model_registry).filter_map do |model, meta|
      next if meta.is_a?(Hash) && meta["enabled"] == false

      model.to_s
    end

    available = []
    available.concat(enabled_models)
    available << config.dig("agents", "defaults", "model", "primary").to_s
    available.concat(Array(config.dig("agents", "defaults", "model", "fallbacks")).map(&:to_s))
    available << config.dig("agents", "defaults", "subagents", "model").to_s
    available << config.dig("agents", "defaults", "memorySearch", "model").to_s
    available.concat(agents.map { |a| a[:model] })
    available.concat(cron_models.map { |j| j[:model] })

    {
      primary: config.dig("agents", "defaults", "model", "primary").to_s,
      fallbacks: Array(config.dig("agents", "defaults", "model", "fallbacks")).map(&:to_s),
      subagentModel: config.dig("agents", "defaults", "subagents", "model").to_s,
      embeddingModel: config.dig("agents", "defaults", "memorySearch", "model").to_s,
      memoryFallback: config.dig("agents", "defaults", "memorySearch", "fallback").to_s,
      agents: agents,
      cronModels: cron_models,
      availableModels: available.map(&:to_s).reject(&:blank?).uniq.sort,
      enabledModels: enabled_models.reject(&:blank?).uniq.sort
    }
  end

  def fetch_cron_models
    out, err, status = run_command(["openclaw", "cron", "list", "--all", "--json"], timeout: 30)
    return [] unless status.success?

    payload = JSON.parse(out)
    Array(payload["jobs"]).filter_map do |job|
      next unless job.dig("payload", "kind") == "agentTurn"

      {
        id: job["id"].to_s,
        name: job["name"].to_s,
        enabled: !!job["enabled"],
        model: job.dig("payload", "model").to_s
      }
    end
  rescue JSON::ParserError
    Rails.logger.warn("[SettingsApi] Could not parse cron JSON: #{err}")
    []
  rescue StandardError => e
    Rails.logger.warn("[SettingsApi] Failed to fetch cron models: #{e.message}")
    []
  end

  def normalize_model(value)
    value.to_s.strip.presence
  end

  def normalize_model_list(value)
    list = case value
    when String
      value.split(/\r?\n|,/)
    when Array
      value
    else
      []
    end

    list.map { |v| v.to_s.strip }.reject(&:blank?).uniq
  end

  def normalize_agent_models(raw)
    Array(raw).each_with_object({}) do |entry, acc|
      id = entry.is_a?(ActionController::Parameters) ? entry[:id].to_s.strip : entry["id"].to_s.strip
      model = entry.is_a?(ActionController::Parameters) ? entry[:model].to_s.strip : entry["model"].to_s.strip
      next if id.blank? || model.blank?

      acc[id] = model
    end
  end

  def normalize_cron_models(raw)
    Array(raw).each_with_object({}) do |entry, acc|
      id = entry.is_a?(ActionController::Parameters) ? entry[:id].to_s.strip : entry["id"].to_s.strip
      model = entry.is_a?(ActionController::Parameters) ? entry[:model].to_s.strip : entry["model"].to_s.strip
      next if id.blank? || model.blank?

      acc[id] = model
    end
  end

  def apply_config_set(path, value, changed:, errors:, current_value:, json:, label: nil)
    return if value == current_value

    argv = ["openclaw", "config", "set"]
    argv << "--json" if json
    argv << path
    argv << (json ? value.to_json : value.to_s)

    out, err, status = run_command(argv, timeout: 45)
    if status.success?
      changed << (label || path)
    else
      errors << {
        target: (label || path),
        error: err.presence || out.presence || "Failed to set #{path}"
      }
    end
  end

  def apply_cron_model_updates(requested_cron_models, changed:, errors:)
    return if requested_cron_models.empty?

    fetch_cron_models.each do |job|
      id = job[:id]
      next unless requested_cron_models.key?(id)

      requested_model = requested_cron_models[id]
      current_model = job[:model]
      next if requested_model.blank? || requested_model == current_model

      out, err, status = run_command(["openclaw", "cron", "edit", id, "--model", requested_model], timeout: 45)
      if status.success?
        changed << "cron:#{job[:name]}"
      else
        errors << {
          target: "cron:#{job[:name]}",
          error: err.presence || out.presence || "Failed to update cron model"
        }
      end
    end
  end

  TAILSCALE_SCRIPT = File.expand_path("~/.openclaw/scripts/dashbot-tailscale.sh")

  def ensure_dashbot_phone_access
    unless File.executable?(TAILSCALE_SCRIPT)
      return { ok: false, detail: "dashbot-tailscale.sh not found or not executable" }
    end

    out, err, status = run_command(["bash", TAILSCALE_SCRIPT], timeout: 60)

    {
      ok: status.success?,
      detail: out.presence || err.presence
    }
  rescue StandardError => e
    { ok: false, detail: e.message }
  end

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
