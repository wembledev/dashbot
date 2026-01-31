# frozen_string_literal: true

class Message < ApplicationRecord
  belongs_to :chat_session
  has_one :card, dependent: :destroy

  validates :content, presence: true

  # == metadata (JSONB)
  #
  # Flexible store for message-level context. Currently used for agentic cards.
  #
  # When a card is attached:
  #   {
  #     "card" => {
  #       "id"        => Integer,       # Card record ID (set after save)
  #       "type"      => String,        # "confirm" | "action"
  #       "prompt"    => String,        # Question shown to the user
  #       "options"   => Array<Hash>,   # [{ "label" => "Yes", "value" => "yes", "style" => "primary" }, ...]
  #       "responded" => Boolean,       # true once the user responds (absent until then)
  #       "response"  => String,        # The chosen option value
  #       "reply"     => String|nil     # Optional agent follow-up after response
  #     }
  #   }
  #
  # Messages without cards have nil or empty metadata.
end
