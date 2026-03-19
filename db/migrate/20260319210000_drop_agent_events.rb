# frozen_string_literal: true

class DropAgentEvents < ActiveRecord::Migration[8.1]
  def up
    drop_table :agent_events
  end

  def down
    create_table :agent_events do |t|
      t.string :event_type, null: false
      t.string :agent_label
      t.string :session_key
      t.string :model
      t.text :description
      t.json :metadata

      t.timestamps
    end

    add_index :agent_events, :event_type
    add_index :agent_events, :created_at
    add_index :agent_events, :session_key
  end
end
