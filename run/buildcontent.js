var fs = require('fs');
var reds = require('./../lib/reds'),
    search = reds.createSearch('craigmar26');

var query = process.argv.slice(2).join(' ');
if (!query) throw new Error('query required');

function readJson(filename) {
    var fd = fs.openSync(filename, 'a+', '0666');
    var stread = fs.readFileSync(filename, 'utf8');
    fs.closeSync(fd);
    return stread;
}

function buildUrl(text){
    var url = '<a href="';
    url = url.concat(text);
    url = url.concat('">');
    url = url.concat(text);
    url = url.concat('</a>');
    return(url);
}

// query

var json = readJson('jobs.js');
var data = JSON.parse(json);

search.query(query).end(function(err, ids){
  if (err) throw err;
  var res = ids.map(function(i){ return i; });
  res.forEach(function(str){
    console.log('<h2>');
    console.log(data[str].title);
    console.log('</h2>');
    var url = buildUrl(data[str].url);
    console.log(url);
    console.log('<p>');
    console.log(data[str].content);
    console.log('<hr>');
  });
  process.exit();
});