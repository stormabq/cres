var redis = require('redis'),
    client = redis.createClient();

var redispub = exports.redispub = {
  jsondata: function() {
    client.publish('action', "Some message");
  }
};

redispub.jsondata();
