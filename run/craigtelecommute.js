var cities = require('./craigroups').bigcities, 
    categories = require('./craigdata').categories,
    request = require('request'),
    _ = require('underscore'),
    redis = require('redis'),
    client = redis.createClient(),
    xml2js = require('./../lib/xml2js'),
    fs = require('fs'),
    mydata = require('./ztemplate.js').mydata,
    mytags = require('./ztags.js').mytags,
    argv = require('optimist').argv,
    htmlfilters = require('./htmlfilters');

var generateUrls = exports.generateUrls = {
    get : function() {
        var urls = [];
        var template1 = 'craigslist.org/search/';
        var template2 = '?&srchType=A&addOne=telecommuting&format=rss';
        _.each(cities,function(city){
           _.each(categories, function(category) {
                url = 'http://' + city + '.' + template1 + category + template2;
                urls.push(url);   
           }); 
        });
        return urls;
    }
};

var pipeline = exports.pipeline = {
    parser : function(xmlcode) {
        if(xmlcode != null) {
        xmlcode = xmlcode.replace(/\n*/g, "");
        xmlcode = xmlcode.replace(/\\n/g, "");
        xmlcode = xmlcode.replace(/http:/g, "mia123mia");
        xmlcode = xmlcode.replace(/https:/g, "mia456mia");
        xmlcode = xmlcode.replace(/:/g, "");
        xmlcode = xmlcode.replace(/mia123mia/g, "http:");
        xmlcode = xmlcode.replace(/mia456mia/g, "https:");
        }
        return xmlcode;
    }
};

var jasonparser = exports.jasonparser = {
    
    parse : function(content,callback) {
        var parser = new xml2js.Parser({
            explicitArray : true
        });
        parser.addListener('end', function(result) {
            if (result.item != undefined) {
                var url = result.item[0].link[0];
                var city = getCity(url);
                var category = getCategoryTwo(url);
                console.log(city,category,result.item.length);
                callback(result.item.length);
            }
        });
        if (content != null) {
            parser.parseString(content);
        }
    },
    
    parseandstore : function(content) {
        var parser = new xml2js.Parser({
            explicitArray : true
        });
        parser.addListener('end', function(result) {
            storagengine.store(result, function(done) {
            });
        });
        if (content != null) {
            parser.parseString(content);
        }
    }
};

var storagengine = exports.storagengine = {
    store : function(result,callback) {
        if(result.item != undefined) {
            for(var i in result.item) {
                city = getCity(result.item[i].link[0]);
                var json = {};
                json.description = htmlfilters.processDescription(result.item[i].description[0]);
                // save here forever just in case you do not want to process
                // json.description = result.item[i].description[0];
                json.title = result.item[i].title[0];
                json.url = result.item[i].link[0];
                json.options = {
                    'city' : city
                };
                // I am going to change this to the posting ID which is part of the URL
                json.uuid = Math.floor(Math.random() * 9999);
                writeJsonToRedis(json.url,json, function(done) {
                }); 
            }
        }
    }
};


client.on("error", function (err) {
    console.log("error event - " + client.host + ":" + client.port + " - " + err);
});

function rsstojson() {
    client.keys("rss:craigcity:*", function(err, replies) {
        if(err) {
            return console.error("error response - " + err);
        }
        console.log(replies.length + " replies:");
        replies.forEach(function(reply, i) {
            _.each(categories, function(category) {
                client.hget(reply, category, function(err, content) {
                    if(err) {
                        return console.error("error response - " + err);
                    }
                    var content = pipeline.parser(content);
                    jasonparser.parseandstore(content);
                });
            })
        });
    });
};

var redisreport = exports.redisreport = {
  showdata: function() {
    client.keys("rss:craigcity:*", function(err, replies) {
        if(err) {
            return console.error("error response - " + err);
        }
        console.log(replies.length + " replies:");
        var total = 0;
        replies.forEach(function(reply, i) {
            _.each(categories, function(category) {
                client.hget(reply, category, function(err, content) {
                    if(err) {
                        return console.error("error response - " + err);
                    }
                    var content = pipeline.parser(content);
                    jasonparser.parse(content, function(numofitems){
                        total = total + numofitems;
                        console.log(total);
                    });
                });
            })
        });
    });
  }
};

var redistojson = exports.redistojson = {
  writedata: function() {
    var writeStream = fs.createWriteStream('ztemplate.js');
    writeStream.write('var mydata = exports.mydata = {"data":');
    writeStream.write('[');
    var counter = 0;
    var sum = 0;
    client.keys("craigcity:*", function(err, replies) {
        if(err) {
            return console.error("error response - " + err);
        }
        // console.log(replies.length + " replies:");
        _.each(replies, function(reply, i) {
            // console.log('--->',reply);
            client.llen(reply, function(err, length) {
                // console.log(length);
                sum = sum + length;
                for (j = 0; j < length; j++) {
                    client.lindex(reply, j, function(err, listitem) {
                        writeStream.write(listitem);
                        counter++;
                        // console.log('counter = ',counter);
                        if (counter == sum) {
                            console.log('sum = ', sum);
                            writeStream.write(']}');
                        }
                        else {
                        writeStream.write(',');
                        }
                    });
                }
            });
        });
    });
  }
};

function getCity(content) {
    var city = '';
    var url = /(\w+):\/\/([\w.]+)(\.craigslist\.org)\/(\S*)/;
    var result = content.match(url);
    if(result != null) {
        city = result[2];
    }
    return city;
}

// this is from the URL stored in the json
function getCategoryTwo(content) {
    var category = '';
    var url = /(\w+):\/\/([\w.]+)(\.craigslist\.org)\/(\w+)(\/(\S*))/;
    var result = content.match(url);
    if(result != null) {
        category = result[4];
    }
    return category;
}

// this is from the top level rss feed thus index.rss
function getCategory(content) {
    var category = '';
    // var url = /(\w+):\/\/([\w.]+)(\.craigslist\.org)\/(\w+)(\/index\.rss)/;
    var url = /(\w+):\/\/([\w.]+)(\.craigslist\.org)\/search\/(\w+)(\?&srchType=A)/;
    var result = content.match(url);
    if(result != null) {
        category = result[4];
    }
    return category;
}

function writeJsonToRedis(url,content, callback) {
    city = getCity(url);
    // console.log('writeJsonToRedis ' + city);
    client.lpush('craigcity:' + city, JSON.stringify(content), function(err, result) {
        callback(result);
    });
    
}        
 
function writeRssToRedis(url,content, callback) {
    city = getCity(url);
    category = getCategory(url);
    client.hset('rss:craigcity:' + city, category, content, function(err, result) {
        callback(result);
    });
}        

function deleterediskeys(callback) {
    _.each(cities, function(city){
        console.log('deleting craigcity:city ' + city);
        client.del('craigcity:' + city, function(err, result) {
            callback(result);
        });    
    });
}       

function getUrlContent(url,callback) {
    request(url, function(error, response, body) {
        console.log(url);
        if(!error && response.statusCode == 200) {
            callback(url,body);
        }
    })
}

function processCraig() {
    var urls = generateUrls.get();
    _.each(urls,function(url){
        getUrlContent(url, function(url,content) {
            writeRssToRedis(url,content, function(done) {
            });    
        });
    });
}

function checkForMatch(tag,text) {
    var pattern = new RegExp(tag, 'i');
    var match = pattern.exec(text);
    if(match) {
        // console.log('Tag = ',match[0],'Text = ',match['input']);
        return true;
    }
    return false;
}

function buildOptions(optionsin,titles,descriptions) {
    
    var options = optionsin;
    if(titles.length > 0) {
        if(options.titles) {
            options.titletags = _.union(titles,options.titles);
        }
        else {
            options.titletags = titles;
        }
    }
    else {
        options.titletags = [];
    }
    
    if(descriptions.length > 0) {
        if(descriptions.titles) {
            options.descriptiontags = _.union(descriptions,options.descriptions);
        }
        else {
            options.descriptiontags = descriptions;
        }
    }
    else {
        options.descriptiontags = [];
    }
    return(options);
}

function postprocesstags() {
    var data = mydata.data;
    var tags = mytags.tags;
    var cities = [];
    var alltitletags = [];
    var alldescriptiontags = [];
    var alldata = [];
    _.each(data, function(item,index) {
        // console.log(index);
        var options, titletags = [], descriptiontags = [];
        var ignorewrite = true;
        _.each(tags, function(tag) {
           var matchit = false;
           if(checkForMatch(tag,item.title)) {
               matchit = true;
               ignorewrite = false;
               titletags.push(tag);
           }
           if(checkForMatch(tag,item.description)) {
               matchit = true;
               ignorewrite = false;
               descriptiontags.push(tag);
           }
           if(matchit) {
               options = buildOptions(item.options,titletags,descriptiontags);
           }   
        });
        
           if(!ignorewrite) {
            item.options = options;
            cities.push(item.options.city);
            cities = _.uniq(cities);
            
            var tmparray = item.options.titletags;
            if (tmparray.length != 0) {
                alltitletags.push(tmparray[0]);
                alltitletags = _.uniq(alltitletags);
            }
            
            tmparray = item.options.descriptiontags;
            if (tmparray.length != 0) {
                alldescriptiontags.push(tmparray[0]);
                alldescriptiontags = _.uniq(alldescriptiontags);
            }
            
            alldata.push(item);
            
            var citystring = '{cities:' + JSON.stringify(cities) + ',';
            var descriptiontagstring = 'descriptiontags:' + JSON.stringify(alldescriptiontags) + ',';
            var titletagstring = 'titletags:' + JSON.stringify(alltitletags) + ',';
            var jsonstring = 'data:' + JSON.stringify(alldata);
            
            jsonstring = citystring + descriptiontagstring + titletagstring + jsonstring + '}';
            var frontmatter = 'var mydata = ';
            jsonstring = frontmatter + jsonstring;
            var filename = 'dataset.js';
            fs.writeFileSync(filename,jsonstring);
        }
    });
}

function postprocessnotags() {
    var data = mydata.data;
    var tags = mytags.tags;
    var cities = [];
    var alltitletags = [];
    var alldescriptiontags = [];
    var alldata = [];
    _.each(data, function(item,index) {
        // console.log(index);
        var options, titletags = [], descriptiontags = [];
        options = buildOptions(item.options,titletags,descriptiontags);
        
        item.options = options;
        cities.push(item.options.city);
        cities = _.uniq(cities);
            
        var tmparray = item.options.titletags;
        if (tmparray.length != 0) {
            alltitletags.push(tmparray[0]);
            alltitletags = _.uniq(alltitletags);
        }
            
        tmparray = item.options.descriptiontags;
        if (tmparray.length != 0) {
            alldescriptiontags.push(tmparray[0]);
            alldescriptiontags = _.uniq(alldescriptiontags);
        }
            
        alldata.push(item);
            
        var citystring = '{cities:' + JSON.stringify(cities) + ',';
        var descriptiontagstring = 'descriptiontags:' + JSON.stringify(alldescriptiontags) + ',';
        var titletagstring = 'titletags:' + JSON.stringify(alltitletags) + ',';
        var jsonstring = 'data:' + JSON.stringify(alldata);
            
        jsonstring = citystring + descriptiontagstring + titletagstring + jsonstring + '}';
        var frontmatter = 'var mydata = ';
        jsonstring = frontmatter + jsonstring;
        var filename = 'dataset.js';
        fs.writeFileSync(filename,jsonstring);
    });
}

if(process.argv[1] === __filename) {
    
    if(argv.r) {
        redisreport.showdata();   
    }
    else if (argv.b){
        console.log('building everything from scratch');
        processCraig()
    }
    else if (argv.m){
        console.log('copying data from rss to json');
        deleterediskeys(function(done){});         
        rsstojson();
    }
    else if (argv.j){
        console.log('dump out json file from redis');
        redistojson.writedata();
    }
    else if (argv.p){
        console.log('post process json file keeping only the jobs with tags');
        postprocesstags();
    }
    else if (argv.q){
        console.log('post process json file keeping all the jobs with no tags');
        postprocessnotags();
    }
    else if (argv.d){
        console.log('post process json file');
        deleterediskeys(function(done){
            process.exit(0);
        });
    }
    else {
        console.log('Use one of the following flags:');
        console.log('-b to build everything from scratch');
        console.log('-m to move data from rss to json');
        console.log('-j dump out json file from redis');
        console.log('-p post process json file tags');
        console.log('-q post process json file no tags')
        console.log('-r show a redis report');
        console.log('-d delete craigcity:*');
        process.exit(0);
    }
}
