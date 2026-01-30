# frozen_string_literal: true

class QrToken < ApplicationRecord
  EXPIRES_IN = 5.minutes

  belongs_to :user, optional: true

  before_validation :generate_token, on: :create
  before_create :set_expiration

  validates :token, presence: true, uniqueness: true

  scope :valid, -> { where(used: false).where("expires_at > ?", Time.current) }

  def self.create_for_session(session_id)
    create!(session_id: session_id)
  end

  def self.find_valid(token)
    valid.find_by(token: token)
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

  private

  def generate_token
    self.token = SecureRandom.urlsafe_base64(32)
  end

  def set_expiration
    self.expires_at = EXPIRES_IN.from_now
  end
end
