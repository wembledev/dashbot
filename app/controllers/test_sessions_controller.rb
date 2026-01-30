# frozen_string_literal: true

# Test-only controller for setting session state in integration tests.
class TestSessionsController < ApplicationController
  skip_before_action :require_authentication
  skip_before_action :verify_authenticity_token

  def create
    session[:user_id] = params[:user_id]
    session[:profile_id] = params[:profile_id]
    head :ok
  end
end
