class CreateQrTokens < ActiveRecord::Migration[8.1]
  def change
    create_table :qr_tokens do |t|
      t.string :token
      t.string :session_id
      t.references :user, null: true, foreign_key: true
      t.boolean :used, default: false
      t.datetime :expires_at

      t.timestamps
    end
  end
end
