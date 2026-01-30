password = ENV.fetch("DASHBOT_PASSWORD") {
  abort "Set DASHBOT_PASSWORD environment variable to create the admin user"
}

user = User.find_or_create_by!(id: 1) do |u|
  u.password = password
end

user.profiles.find_or_create_by!(name: "Driver")

puts "Seeded user with profile 'Driver'"
