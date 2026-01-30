# frozen_string_literal: true

class Setting < ApplicationRecord
  belongs_to :settable, polymorphic: true, optional: true

  validates :key, presence: true, uniqueness: { scope: [ :settable_type, :settable_id ] }

  def self.get(settable, key)
    find_by(settable: settable, key: key)&.value
  end

  def self.set(settable, key, value)
    setting = find_or_initialize_by(settable: settable, key: key)
    setting.update!(value: value.to_s)
    setting
  end
end
