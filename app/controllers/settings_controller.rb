# frozen_string_literal: true

class SettingsController < ApplicationController
  def index
    render inertia: "settings/index"
  end
end
