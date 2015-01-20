require 'redis'

redis = Redis.new

trap(:INT) { puts; exit }

begin
  redis.subscribe(:action) do |on|
    on.subscribe do |channel, subscriptions|
      puts "Subscribed to ##{channel} (#{subscriptions} subscriptions)"
    end

    on.message do |channel, message|
      mytime = Time.now
      puts "##{channel}: #{message}: #{mytime}"
    end

  end
rescue Redis::BaseConnectionError => error
  puts "#{error}, retrying in 1s"
  sleep 1
  retry
end
