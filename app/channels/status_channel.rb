# frozen_string_literal: true

class StatusChannel < ApplicationCable::Channel
  # Track number of viewers (class variable for simplicity, use Redis for production scale)
  @@viewer_count = 0
  @@viewer_mutex = Mutex.new

  def subscribed
    stream_from "status_updates"

    # Increment viewer count and broadcast status_requested if first viewer
    @@viewer_mutex.synchronize do
      @@viewer_count += 1
      if @@viewer_count == 1
        request_status_from_plugin
      end
    end

    # Send viewer count to logs
    logger.info "[StatusChannel] Viewer joined, total viewers: #{@@viewer_count}"
  end

  def unsubscribed
    # Decrement viewer count and broadcast status_stopped if last viewer left
    @@viewer_mutex.synchronize do
      @@viewer_count -= 1
      if @@viewer_count == 0
        stop_status_from_plugin
      end
    end

    logger.info "[StatusChannel] Viewer left, total viewers: #{@@viewer_count}"
  end

  # Called by plugin to send status data
  def receive_status(data)
    # Broadcast to all status page viewers
    ActionCable.server.broadcast("status_updates", {
      type: "status_update",
      data: data
    })
  end

  class << self
    # Class method to broadcast status data from plugin
    def broadcast_status(data)
      ActionCable.server.broadcast("status_updates", {
        type: "status_update",
        data: data
      })
    end

    def viewer_count
      @@viewer_count
    end
  end

  private

  def request_status_from_plugin
    # Broadcast to plugin connection via ChatChannel
    # The plugin listens to this and starts sending status updates
    ActionCable.server.broadcast("plugin_commands", {
      type: "status_requested"
    })
    logger.info "[StatusChannel] Sent status_requested to plugin"
  end

  def stop_status_from_plugin
    # Tell plugin to stop sending status updates
    ActionCable.server.broadcast("plugin_commands", {
      type: "status_stopped"
    })
    logger.info "[StatusChannel] Sent status_stopped to plugin"
  end
end
