# frozen_string_literal: true

class Message < ApplicationRecord
  belongs_to :chat_session

  validates :content, presence: true
end
