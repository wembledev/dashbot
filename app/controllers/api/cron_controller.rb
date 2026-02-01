# frozen_string_literal: true

class Api::CronController < ActionController::API
  include ApiAuthentication

  before_action :authenticate_token!

  # POST /api/cron/:id/run - Trigger a cron job immediately
  def run
    job_id = params[:id]

    ActionCable.server.broadcast("plugin_commands", {
      type: "cron_run",
      job_id: job_id
    })

    render json: { ok: true, message: "Cron job triggered", job_id: job_id }
  end

  # POST /api/cron/:id/enable - Enable a cron job
  def enable
    job_id = params[:id]

    ActionCable.server.broadcast("plugin_commands", {
      type: "cron_enable",
      job_id: job_id,
      enabled: true
    })

    render json: { ok: true, message: "Cron job enabled", job_id: job_id }
  end

  # POST /api/cron/:id/disable - Disable a cron job
  def disable
    job_id = params[:id]

    ActionCable.server.broadcast("plugin_commands", {
      type: "cron_disable",
      job_id: job_id,
      enabled: false
    })

    render json: { ok: true, message: "Cron job disabled", job_id: job_id }
  end
end
