# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_01_29_234709) do
  create_table "chat_sessions", force: :cascade do |t|
    t.text "context"
    t.datetime "created_at", null: false
    t.integer "profile_id", null: false
    t.string "title"
    t.datetime "updated_at", null: false
    t.integer "user_id", null: false
    t.index ["profile_id"], name: "index_chat_sessions_on_profile_id"
    t.index ["user_id"], name: "index_chat_sessions_on_user_id"
  end

  create_table "messages", force: :cascade do |t|
    t.integer "chat_session_id", null: false
    t.text "content"
    t.datetime "created_at", null: false
    t.json "metadata"
    t.string "role"
    t.datetime "updated_at", null: false
    t.index ["chat_session_id"], name: "index_messages_on_chat_session_id"
  end

  create_table "profiles", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "name"
    t.datetime "updated_at", null: false
    t.integer "user_id", null: false
    t.index ["user_id"], name: "index_profiles_on_user_id"
  end

  create_table "qr_tokens", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "expires_at"
    t.string "session_id"
    t.string "token"
    t.datetime "updated_at", null: false
    t.boolean "used", default: false
    t.integer "user_id"
    t.index ["user_id"], name: "index_qr_tokens_on_user_id"
  end

  create_table "settings", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "key", null: false
    t.integer "settable_id"
    t.string "settable_type"
    t.datetime "updated_at", null: false
    t.string "value"
    t.index ["settable_type", "settable_id"], name: "index_settings_on_settable"
  end

  create_table "users", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "encrypted_password"
    t.datetime "last_login_at"
    t.datetime "updated_at", null: false
  end

  add_foreign_key "chat_sessions", "profiles"
  add_foreign_key "chat_sessions", "users"
  add_foreign_key "messages", "chat_sessions"
  add_foreign_key "profiles", "users"
  add_foreign_key "qr_tokens", "users"
end
