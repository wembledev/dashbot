class CreateAgentEvents < ActiveRecord::Migration[8.1]
  def change
    create_table :agent_events do |t|
      t.string :event_type, null: false  # spawned, completed, failed, cron_run
      t.string :agent_label             # e.g. "seed-tasks"
      t.string :session_key             # OpenClaw session key
      t.string :model                   # opus, sonnet, haiku
      t.text :description               # Human-readable task description
      t.json :metadata                  # Flexible: result, error, duration_seconds, etc.
      t.timestamps
    end

    add_index :agent_events, :event_type
    add_index :agent_events, :created_at
    add_index :agent_events, :session_key
  end
end
