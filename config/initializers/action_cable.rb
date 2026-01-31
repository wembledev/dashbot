# frozen_string_literal: true

# ActionCable heartbeat: 3s (default) → 30s
#
# The default 3-second ping generates ~28,800 WebSocket messages/day even
# when nobody has the dashboard open. 30 seconds is plenty to keep the
# connection alive — nginx default proxy_read_timeout is 60s.
#
# See: actioncable/lib/action_cable/server/connections.rb
ActionCable::Server::Connections.send(:remove_const, :BEAT_INTERVAL)
ActionCable::Server::Connections.const_set(:BEAT_INTERVAL, 30)
