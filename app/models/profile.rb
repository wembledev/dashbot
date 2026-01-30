# frozen_string_literal: true

class Profile < ApplicationRecord
  belongs_to :user
  has_many :chat_sessions, dependent: :destroy

  validates :name, presence: true
end
