# frozen_string_literal: true

module ApiAuthentication
  extend ActiveSupport::Concern

  private

  def authenticate_token!
    token = request.headers["Authorization"]&.delete_prefix("Bearer ")&.strip
    expected = ENV.fetch("DASHBOT_API_TOKEN", "")

    unless token.present? && expected.present? && ActiveSupport::SecurityUtils.secure_compare(token, expected)
      render json: { error: "Unauthorized" }, status: :unauthorized
    end
  end
end
