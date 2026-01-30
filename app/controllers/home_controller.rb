# frozen_string_literal: true

class HomeController < ApplicationController
  def index
    render inertia: "home/index"
  end
end
