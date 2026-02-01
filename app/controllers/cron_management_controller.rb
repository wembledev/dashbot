# frozen_string_literal: true

# Cookie-auth cron management endpoints for the dashboard UI
class CronManagementController < ApplicationController
  before_action :require_authentication

  # POST /cron/:id/run
  def run
    job_id = params[:id]

    ActionCable.server.broadcast("plugin_commands", {
      type: "cron_run",
      job_id: job_id
    })

    render json: { ok: true, message: "Cron job triggered", job_id: job_id }
  end

  # POST /cron/:id/toggle
  def toggle
    job_id = params[:id]
    enabled = params[:enabled] != "false" && params[:enabled] != false

    ActionCable.server.broadcast("plugin_commands", {
      type: enabled ? "cron_enable" : "cron_disable",
      job_id: job_id,
      enabled: enabled
    })

    render json: { ok: true, message: "Cron job #{enabled ? 'enabled' : 'disabled'}", job_id: job_id }
  end
end
