# frozen_string_literal: true

require "test_helper"

class ActionCableInitializerTest < ActiveSupport::TestCase
  test "BEAT_INTERVAL is 30 seconds, not default 3" do
    assert_equal 30, ActionCable::Server::Connections::BEAT_INTERVAL,
      "ActionCable ping should be 30s to reduce idle WebSocket chatter"
  end

  test "SolidCable polling interval is 1 second in production config" do
    cable_config = Rails.root.join("config/cable.yml").read
    production_section = cable_config.split(/^production:/)[1]
    assert_match(/polling_interval:\s*1\.second/, production_section,
      "SolidCable should poll every 1s, not 100ms")
  end
end
