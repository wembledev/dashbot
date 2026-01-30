class CreateSettings < ActiveRecord::Migration[8.1]
  def change
    create_table :settings do |t|
      t.references :settable, polymorphic: true, null: true
      t.string :key, null: false
      t.string :value

      t.timestamps
    end
  end
end
