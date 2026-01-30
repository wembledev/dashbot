# frozen_string_literal: true

class QrToken < ApplicationRecord
  EXPIRES_IN = 5.minutes

  belongs_to :user, optional: true

  before_validation :generate_token, on: :create
  before_create :set_expiration

  validates :token, presence: true, uniqueness: true

  scope :pending, -> { where(used: false).where("expires_at > ?", Time.current) }
  scope :unexpired, -> { where("expires_at > ?", Time.current) }

  def self.create_for_session(session_id)
    create!(session_id: session_id)
  end

  def self.find_pending(token)
    pending.find_by(token: token)
  end

  def self.find_unexpired(token)
    unexpired.find_by(token: token)
  end

  def claim!(user)
    update!(user: user, used: true)
  end

  def claimed?
    used? && user_id.present?
  end

  def owned_by_session?(session_id)
    self.session_id == session_id
  end

  def to_qr_png_data_uri(base_url:)
    qr = RQRCode::QRCode.new("#{base_url}/auth/login/#{token}")
    png = qr.as_png(size: 280, border_modules: 2)
    "data:image/png;base64,#{Base64.strict_encode64(png.to_s)}"
  end

  private

  def generate_token
    self.token = SecureRandom.urlsafe_base64(32)
  end

  def set_expiration
    self.expires_at = EXPIRES_IN.from_now
  end
end
