var fs = require('fs'), 
    _ = require('underscore'),
    reds = require('./../lib/reds'),
    search = reds.createSearch('craigmar26');

function readJson(filename) {
    var fd = fs.openSync(filename, 'a+', '0666');
    var contentjson = fs.readFileSync(filename, 'utf8');
    fs.closeSync(fd);
    return contentjson;
}

function writeHitsToRedis(index,text,uuid) {
    var pattern = new RegExp(index, 'i');
    var match = pattern.exec(text);
    if(match) {
        console.log('Index = ',match[0],'Content = ',match['input']);
        search.index(index, uuid);
    }    
}

var index = ['node.js', 'nodejs', 'redis', 'mongo', 'Dakota'];

var json = readJson('jobs.js');
var content = JSON.parse(json);
console.log('Read in',content.length,'objects');
_.each(content, function(obj){
    _.each(index, function(phrase){
        writeHitsToRedis(phrase,obj.title,obj.uuid);
        writeHitsToRedis(phrase,obj.content,obj.uuid);
    })
});
setTimeout(function() {
    process.exit();
}, 30000);
