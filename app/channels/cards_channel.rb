# frozen_string_literal: true

class CardsChannel < ApplicationCable::Channel
  def subscribed
    stream_from "cards"
  end

  def unsubscribed
    # Clean up
  end
end
