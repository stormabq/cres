var fs = require('fs');
var reds = require('./../lib/reds'),
    search = reds.createSearch('craig');

var query = process.argv.slice(2).join(' ');
if (!query) throw new Error('query required');

function readJson(filename) {
    var fd = fs.openSync(filename, 'a+', '0666');
    var stread = fs.readFileSync(filename, 'utf8');
    fs.closeSync(fd);
    return stread;
}

// query

var json = readJson('./json1.js');
data = JSON.parse(json);

search.query(query).end(function(err, ids){
  if (err) throw err;
  var res = ids.map(function(i){ return i; });
  console.log();
  console.log('  Search results for "%s"', query);
  res.forEach(function(str){
    console.log(data[str].title);
    console.log(data[str].content);
    console.log();
  });
  console.log();
  process.exit();
});