# frozen_string_literal: true

class ChatSession < ApplicationRecord
  belongs_to :user
  belongs_to :profile
  has_many :messages, dependent: :destroy
  has_many :cards, dependent: :destroy

  validates :title, presence: true

  scope :recent, -> { order(updated_at: :desc) }

  def message_count
    messages.count
  end
end
