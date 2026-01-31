# frozen_string_literal: true

class Card < ApplicationRecord
  belongs_to :chat_session
  belongs_to :message, optional: true

  validates :card_type, presence: true, inclusion: { in: %w[confirm select] }
  validates :prompt, presence: true
  validates :status, presence: true, inclusion: { in: %w[pending responded expired] }

  scope :pending, -> { where(status: "pending") }
  scope :responded, -> { where(status: "responded") }

  def pending?
    status == "pending"
  end

  def responded?
    status == "responded"
  end

  def respond!(value)
    return false unless pending?

    update!(
      status: "responded",
      response: value,
      responded_at: Time.current
    )
  end
end
