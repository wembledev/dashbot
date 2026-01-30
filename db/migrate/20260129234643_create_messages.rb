class CreateMessages < ActiveRecord::Migration[8.1]
  def change
    create_table :messages do |t|
      t.references :chat_session, null: false, foreign_key: true
      t.string :role
      t.text :content
      t.json :metadata

      t.timestamps
    end
  end
end
