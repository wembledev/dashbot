# frozen_string_literal: true

class User < ApplicationRecord
  has_secure_password
  alias_attribute :password_digest, :encrypted_password

  has_many :profiles, dependent: :destroy
  has_many :chat_sessions
end
