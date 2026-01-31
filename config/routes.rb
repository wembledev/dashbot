Rails.application.routes.draw do
  # Authentication
  get "login", to: "auth#index", as: :login
  get "login/:token", to: "auth#login_form", as: :qr_login
  post "login/:token", to: "auth#login", as: :auth_login
  delete "logout", to: "auth#logout", as: :logout

  scope "qr" do
    get "/", to: "auth#qr", as: :qr
    get ":token/status", to: "auth#qr_status", as: :qr_status
  end

  # Dashboard
  get "dashboard", to: "home#index", as: :dashboard
  delete "dashboard/messages", to: "home#clear_messages", as: :clear_messages

  # Settings
  get "settings", to: "settings#index", as: :settings

  # Status
  get "status", to: "status#index", as: :status
  get "status/poll", to: "status#poll", as: :status_poll
  post "status/keepalive", to: "status#keepalive", as: :status_keepalive

  # Status API (token auth - receives data from OpenClaw plugin)
  post "api/status/update", to: "status_api#update", defaults: { format: :json }

  # Messages API (token auth - assistant messages from agent)
  post "api/messages/respond", to: "messages_api#respond", defaults: { format: :json }

  # Cards API (token auth - agentic card push + response)
  post "api/cards", to: "cards_api#create", defaults: { format: :json }
  post "api/cards/:id/respond", to: "cards_api#respond", as: :card_respond, defaults: { format: :json }
  post "api/cards/:id/reply", to: "cards_api#reply", as: :card_reply, defaults: { format: :json }
  get  "api/cards/pending", to: "cards_api#pending", defaults: { format: :json }

  # Health
  get "up" => "rails/health#show", as: :rails_health_check

  # Test-only
  post "test_sign_in", to: "test_sessions#create" if Rails.env.test?

  root to: redirect("/dashboard")
end
