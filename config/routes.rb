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
  delete "status/sessions/:key", to: "status#close_session", as: :close_session, constraints: { key: /[^\/]+/ }

  # Agent Events (cookie-auth for dashboard)
  get "status/events", to: "status#events", as: :status_events

  # Cron Management (cookie-auth for dashboard)
  post "cron/:id/run", to: "cron_management#run", as: :cron_run, constraints: { id: /[^\/]+/ }
  post "cron/:id/toggle", to: "cron_management#toggle", as: :cron_toggle, constraints: { id: /[^\/]+/ }

  # API (token auth — used by OpenClaw plugin and agent)
  namespace :api, defaults: { format: :json } do
    # Status
    post "status/update", to: "status#update"

    # Sessions
    get "sessions", to: "sessions#index"
    delete "sessions/:id", to: "sessions#destroy", constraints: { id: /[^\/]+/ }

    # Agent Events
    get "agent/events", to: "agent_events#index"
    post "agent/events", to: "agent_events#create"

    # Cron Management (token auth)
    post "cron/:id/run", to: "cron#run", constraints: { id: /[^\/]+/ }
    post "cron/:id/enable", to: "cron#enable", constraints: { id: /[^\/]+/ }
    post "cron/:id/disable", to: "cron#disable", constraints: { id: /[^\/]+/ }

    # Messages
    post "messages/respond", to: "messages#respond"

    # Cards
    post "cards", to: "cards#create"
    post "cards/:id/respond", to: "cards#respond", as: :card_respond
    post "cards/:id/reply", to: "cards#reply", as: :card_reply
    get  "cards/pending", to: "cards#pending"
  end

  # Settings API (token auth - model selection, memory management)
  post "api/settings/model", to: "settings_api#update_model", defaults: { format: :json }
  post "api/memory/save", to: "settings_api#save_memory", defaults: { format: :json }
  post "api/memory/reindex", to: "settings_api#reindex_memory", defaults: { format: :json }

  # Health
  get "up" => "rails/health#show", as: :rails_health_check

  # Test-only
  post "test_sign_in", to: "test_sessions#create" if Rails.env.test?

  root to: redirect("/dashboard")
end
