Rails.application.routes.draw do
  # Authentication
  get "login", to: "auth#index", as: :login
  post "login/:token", to: "auth#login", as: :auth_login
  delete "logout", to: "auth#logout", as: :logout

  scope "qr" do
    get "/", to: "auth#qr", as: :qr
    get ":token/status", to: "auth#qr_status", as: :qr_status
    get ":token", to: "auth#login_form", as: :qr_login
  end

  # Dashboard
  get "dashboard", to: "home#index", as: :dashboard

  # Health
  get "up" => "rails/health#show", as: :rails_health_check

  # Test-only
  post "test_sign_in", to: "test_sessions#create" if Rails.env.test?

  root to: redirect("/dashboard")
end
