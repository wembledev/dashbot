# frozen_string_literal: true

module ApplicationCable
  class Connection < ActionCable::Connection::Base
    identified_by :current_user

    def connect
      self.current_user = find_verified_user
    end

    private

    def find_verified_user
      find_user_from_session || find_user_from_token || reject_unauthorized_connection
    end

    def find_user_from_session
      User.find_by(id: request.session[:user_id])
    end

    def find_user_from_token
      token = request.params[:token]
      return unless token.present? && ActiveSupport::SecurityUtils.secure_compare(token, api_token)

      User.first
    end

    def api_token
      ENV.fetch("DASHBOT_API_TOKEN", "")
    end
  end
end
