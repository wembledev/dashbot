# frozen_string_literal: true

module Authentication
  extend ActiveSupport::Concern

  included do
    before_action :require_authentication
    helper_method :current_user, :current_profile
  end

  private

  def current_user
    @current_user ||= User.find_by(id: session[:user_id])
  end

  def current_profile
    @current_profile ||= Profile.find_by(id: session[:profile_id])
  end

  def require_authentication
    unless current_user
      session.clear
      redirect_to login_path
    end
  end

  def start_session(user, profile = nil)
    profile ||= user.profiles.first
    session[:user_id] = user.id
    session[:profile_id] = profile&.id
  end

  def end_session
    session.clear
  end
end
