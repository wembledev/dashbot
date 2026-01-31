class CreateCards < ActiveRecord::Migration[8.1]
  def change
    create_table :cards do |t|
      t.string :card_type, null: false
      t.text :prompt, null: false
      t.json :options, null: false, default: "[]"
      t.string :status, null: false, default: "pending"
      t.string :response
      t.json :metadata
      t.references :message, foreign_key: true
      t.references :chat_session, null: false, foreign_key: true
      t.datetime :responded_at

      t.timestamps
    end
    add_index :cards, :status
  end
end
