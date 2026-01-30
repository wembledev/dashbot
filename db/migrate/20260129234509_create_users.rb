class CreateUsers < ActiveRecord::Migration[8.1]
  def change
    create_table :users do |t|
      t.string :encrypted_password
      t.datetime :last_login_at

      t.timestamps
    end
  end
end
