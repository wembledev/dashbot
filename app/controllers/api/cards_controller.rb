# frozen_string_literal: true

class Api::CardsController < ApplicationController
  include ApiAuthentication

  skip_before_action :require_authentication
  skip_before_action :verify_authenticity_token
  before_action :authenticate_api!

  # POST /api/cards — Create a card and broadcast it
  def create
    session = find_or_create_session

    card = session.cards.build(
      card_type: params[:type] || "confirm",
      prompt: params[:prompt],
      options: params[:options] || [],
      metadata: params[:metadata] || {}
    )

    unless card.valid?
      return render json: { error: card.errors.full_messages }, status: :unprocessable_entity
    end

    # Create an assistant message with card metadata
    message = session.messages.create!(
      role: "assistant",
      content: params[:message] || card.prompt,
      metadata: {
        card: {
          id: nil, # will be set after card save
          type: card.card_type,
          prompt: card.prompt,
          options: card.options
        }
      }
    )

    card.message = message
    card.save!

    # Update message metadata with card ID
    message.update!(
      metadata: message.metadata.merge("card" => message.metadata["card"].merge("id" => card.id))
    )

    # Broadcast message to chat
    ActionCable.server.broadcast("chat_#{session.id}", {
      type: "message",
      message: {
        id: message.id,
        role: message.role,
        content: message.content,
        metadata: message.metadata,
        created_at: message.created_at.iso8601
      }
    })

    # Broadcast card event for plugin
    ActionCable.server.broadcast("cards", {
      type: "card_created",
      card: serialize_card(card)
    })

    render json: { ok: true, card: serialize_card(card) }, status: :created
  end

  # POST /api/cards/:id/respond — Respond to a card
  def respond
    card = Card.find(params[:id])

    unless card.pending?
      return render json: { error: "Card already responded", card: serialize_card(card) }, status: :conflict
    end

    card.respond!(params[:value])

    # Broadcast updated card to chat (update existing message metadata)
    if card.message
      card.message.update!(
        metadata: card.message.metadata.merge(
          "card" => card.message.metadata["card"].merge(
            "responded" => true,
            "response" => params[:value]
          )
        )
      )

      ActionCable.server.broadcast("chat_#{card.chat_session_id}", {
        type: "card_responded",
        card_id: card.id,
        message_id: card.message_id,
        response: params[:value]
      })
    end

    # Broadcast for plugin to forward as system event
    ActionCable.server.broadcast("cards", {
      type: "card_response",
      card: serialize_card(card)
    })

    render json: { ok: true, card: serialize_card(card) }
  end

  # POST /api/cards/:id/reply — Agent replies to a responded card
  def reply
    card = Card.find(params[:id])
    card.update!(metadata: (card.metadata || {}).merge("reply" => params[:reply]))

    # Broadcast reply to chat
    if card.message
      card.message.update!(
        metadata: card.message.metadata.merge(
          "card" => card.message.metadata["card"].merge("reply" => params[:reply])
        )
      )

      ActionCable.server.broadcast("chat_#{card.chat_session_id}", {
        type: "card_responded",
        card_id: card.id,
        message_id: card.message_id,
        response: card.response,
        reply: params[:reply]
      })
    end

    render json: { ok: true, card: serialize_card(card) }
  end

  # GET /api/cards/pending — List pending cards
  def pending
    cards = Card.pending.order(created_at: :desc).limit(20)
    render json: { cards: cards.map { |c| serialize_card(c) } }
  end

  private

  def serialize_card(card)
    {
      id: card.id,
      type: card.card_type,
      prompt: card.prompt,
      options: card.options,
      status: card.status,
      response: card.response,
      message_id: card.message_id,
      chat_session_id: card.chat_session_id,
      metadata: card.metadata,
      responded_at: card.responded_at&.iso8601,
      created_at: card.created_at.iso8601
    }
  end

  def find_or_create_session
    user = User.first
    profile = user.default_profile
    user.chat_sessions.find_or_create_by!(profile: profile) { |s| s.title = "Chat" }
  end

  def authenticate_api!
    # Accept either Bearer token (API/plugin) or session cookie (browser)
    token = request.headers["Authorization"]&.delete_prefix("Bearer ")&.strip
    expected = ENV.fetch("DASHBOT_API_TOKEN", "")

    token_valid = token.present? && expected.present? && ActiveSupport::SecurityUtils.secure_compare(token, expected)
    session_valid = session[:user_id].present? && User.exists?(id: session[:user_id])

    unless token_valid || session_valid
      render json: { error: "Unauthorized" }, status: :unauthorized
    end
  end
end
