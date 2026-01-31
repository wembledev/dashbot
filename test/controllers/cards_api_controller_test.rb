# frozen_string_literal: true

require "test_helper"

class CardsApiControllerTest < ActionDispatch::IntegrationTest
  setup do
    @token = "test-token-123"
    ENV["DASHBOT_API_TOKEN"] = @token
    @headers = { "Authorization" => "Bearer #{@token}", "Content-Type" => "application/json" }

    @user = User.create!(encrypted_password: "test")
    profile = @user.profiles.create!(name: "Default")
    @session = @user.chat_sessions.create!(profile: profile, title: "Chat")
  end

  teardown do
    ENV.delete("DASHBOT_API_TOKEN")
  end

  # --- Authentication ---

  test "rejects requests without token" do
    post "/api/cards", params: { prompt: "Test?" }.to_json, headers: { "Content-Type" => "application/json" }
    assert_response :unauthorized
  end

  test "rejects requests with wrong token" do
    post "/api/cards", params: { prompt: "Test?" }.to_json,
         headers: { "Authorization" => "Bearer wrong", "Content-Type" => "application/json" }
    assert_response :unauthorized
  end

  # --- Create ---

  test "creates a confirm card" do
    assert_difference [ "Card.count", "Message.count" ], 1 do
      post "/api/cards", params: {
        type: "confirm",
        prompt: "Deploy to production?",
        options: [
          { label: "Yes", value: "yes", style: "primary" },
          { label: "No", value: "no", style: "danger" }
        ]
      }.to_json, headers: @headers
    end

    assert_response :created
    json = JSON.parse(response.body)
    assert json["ok"]
    assert_equal "confirm", json["card"]["type"]
    assert_equal "pending", json["card"]["status"]
    assert_equal "Deploy to production?", json["card"]["prompt"]
  end

  test "creates card with custom message text" do
    post "/api/cards", params: {
      type: "confirm",
      prompt: "Approve?",
      message: "I've drafted a welcome email for the new signup. Ready to send?",
      options: [ { label: "Send", value: "send" }, { label: "Skip", value: "skip" } ]
    }.to_json, headers: @headers

    assert_response :created
    message = Message.last
    assert_equal "I've drafted a welcome email for the new signup. Ready to send?", message.content
    assert_equal "Approve?", message.metadata.dig("card", "prompt")
  end

  test "card is linked to message" do
    post "/api/cards", params: {
      type: "confirm",
      prompt: "Continue?",
      options: [ { label: "Yes", value: "yes" } ]
    }.to_json, headers: @headers

    card = Card.last
    assert_not_nil card.message
    assert_equal card.id, card.message.metadata.dig("card", "id")
  end

  test "rejects invalid card type" do
    post "/api/cards", params: {
      type: "invalid",
      prompt: "Test?",
      options: []
    }.to_json, headers: @headers

    assert_response :unprocessable_entity
  end

  test "rejects missing prompt" do
    post "/api/cards", params: {
      type: "confirm",
      options: [ { label: "Yes", value: "yes" } ]
    }.to_json, headers: @headers

    assert_response :unprocessable_entity
  end

  # --- Respond ---

  test "responds to a pending card" do
    post "/api/cards", params: {
      type: "confirm",
      prompt: "Deploy?",
      options: [ { label: "Yes", value: "yes" }, { label: "No", value: "no" } ]
    }.to_json, headers: @headers

    card_id = JSON.parse(response.body)["card"]["id"]

    post "/api/cards/#{card_id}/respond", params: { value: "yes" }.to_json, headers: @headers

    assert_response :ok
    json = JSON.parse(response.body)
    assert json["ok"]
    assert_equal "responded", json["card"]["status"]
    assert_equal "yes", json["card"]["response"]
    assert_not_nil json["card"]["responded_at"]
  end

  test "cannot respond to already responded card" do
    post "/api/cards", params: {
      type: "confirm",
      prompt: "Deploy?",
      options: [ { label: "Yes", value: "yes" } ]
    }.to_json, headers: @headers

    card_id = JSON.parse(response.body)["card"]["id"]

    post "/api/cards/#{card_id}/respond", params: { value: "yes" }.to_json, headers: @headers
    assert_response :ok

    post "/api/cards/#{card_id}/respond", params: { value: "no" }.to_json, headers: @headers
    assert_response :conflict
  end

  test "respond updates message metadata" do
    post "/api/cards", params: {
      type: "confirm",
      prompt: "Send email?",
      options: [ { label: "Send", value: "send" } ]
    }.to_json, headers: @headers

    card_id = JSON.parse(response.body)["card"]["id"]
    post "/api/cards/#{card_id}/respond", params: { value: "send" }.to_json, headers: @headers

    message = Card.find(card_id).message
    assert_equal true, message.metadata.dig("card", "responded")
    assert_equal "send", message.metadata.dig("card", "response")
  end

  # --- Pending ---

  test "lists pending cards" do
    # Create 2 cards, respond to 1
    post "/api/cards", params: {
      type: "confirm", prompt: "Card 1?",
      options: [ { label: "Yes", value: "yes" } ]
    }.to_json, headers: @headers
    card1_id = JSON.parse(response.body)["card"]["id"]

    post "/api/cards", params: {
      type: "confirm", prompt: "Card 2?",
      options: [ { label: "Yes", value: "yes" } ]
    }.to_json, headers: @headers

    # Respond to card 1
    post "/api/cards/#{card1_id}/respond", params: { value: "yes" }.to_json, headers: @headers

    get "/api/cards/pending", headers: @headers
    assert_response :ok
    json = JSON.parse(response.body)
    assert_equal 1, json["cards"].length
    assert_equal "Card 2?", json["cards"][0]["prompt"]
  end
end
