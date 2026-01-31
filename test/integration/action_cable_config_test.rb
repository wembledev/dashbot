# frozen_string_literal: true

require "test_helper"

class ActionCableConfigTest < ActiveSupport::TestCase
  test "BEAT_INTERVAL is set to 30 seconds" do
    assert_equal 30, ActionCable::Server::Connections::BEAT_INTERVAL,
                 "ActionCable heartbeat should be 30 seconds to reduce idle chatter"
  end

  test "production cable config has 1 second polling interval" do
    cable_config = Rails.application.config_for(:cable)

    # In test environment, let's directly check the production config
    production_config = YAML.load_file(Rails.root.join("config", "cable.yml"))["production"]

    assert_equal "1.second", production_config["polling_interval"],
                 "Production polling_interval should be 1.second to reduce DB queries"
  end
end
