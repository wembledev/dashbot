# frozen_string_literal: true

class AuthController < ApplicationController
  skip_before_action :require_authentication
  skip_before_action :verify_authenticity_token, only: [ :login ]

  def index
    current_user ? redirect_to(dashboard_path) : render(inertia: "auth/qr_login")
  end

  def qr
    session[:qr_session] ||= SecureRandom.hex(16)
    token = QrToken.create_for_session(session[:qr_session])

    render json: {
      token: token.token,
      qr_data: token.to_qr_png_data_uri(url: qr_login_url(token.token)),
      expires_at: token.expires_at.iso8601,
      login_url: (qr_login_url(token.token) if Rails.env.development?)
    }.compact
  end

  def qr_status
    token = QrToken.find_unexpired(params[:token])

    if token&.claimed? && token.owned_by_session?(session[:qr_session])
      start_session(token.user)
      render json: { logged_in: true }
    else
      render json: { logged_in: false, valid: token.present? && !token.used? }
    end
  end

  def login_form
    render inertia: "auth/login", props: { token: params[:token] }
  end

  def login
    token = QrToken.find_pending(params[:token])
    return render json: { error: "Invalid or expired token" }, status: :unauthorized unless token

    user = User.first
    return render json: { error: "Invalid password" }, status: :unauthorized unless user&.authenticate(params[:password].to_s.strip)

    token.claim!(user)
    render json: { success: true }
  end

  def logout
    end_session
    redirect_to root_path
  end
end
