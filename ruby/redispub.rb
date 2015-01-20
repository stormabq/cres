require 'redis'

@redisc = Redis.new
@json1 = "{\"title\": \"The Shining\",
           \"director\": \"Sam Feldman\",
           \"year\": \"1980\"}"

@json2 = "{\"title\": \"Gone with the wind\",
           \"director\": \"Stu Cohn\",
           \"year\": \"1979\"}"

def pubKeyExpire()
  while(1)
    #sleep(6.hours)
    #sleep(10.minutes)
    sleep(5)
    @redisc.publish :action, 'hello'
  end
end

def pubKeyExpireOnce()
    sleep(2)
    @redisc.publish :action, @json1
    sleep(2)
    @redisc.publish :action, @json2
end

#pubKeyExpire()
pubKeyExpireOnce()
