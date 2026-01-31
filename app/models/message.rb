# frozen_string_literal: true

class Message < ApplicationRecord
  belongs_to :chat_session
  has_one :card, dependent: :destroy

  validates :content, presence: true
end
