(function() {

  var _ = require('underscore');
  var root = this;
  var htmlfilters = function(obj) { return new wrapper(obj); };
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = htmlfilters;
    }
    exports.htmlfilters = htmlfilters;
  } else {
    root['htmlfilters'] = htmlfilters;
  }
  htmlfilters.VERSION = '06.08.2012';
  
  var wrapper = function(obj) { this._wrapped = obj; };
  _.prototype = wrapper.prototype;
  var result = function(obj, chain) {
    return chain ? _(obj).chain() : obj;
  };
  
  var addToWrapper = function(name, func) {
    wrapper.prototype[name] = function() {
      var args = slice.call(arguments);
      unshift.call(args, this._wrapped);
      return result(func.apply(_, args), this._chain);
    };
  };
  wrapper.prototype.chain = function() {
    this._chain = true;
    return this;
  };
  wrapper.prototype.value = function() {
    return this._wrapped;
  };
//---- code above this line is Copyright (c) 2009-2012 Jeremy Ashkenas, DocumentCloud

function asciiTest(character) {
    if(character === 239 || character === 191 || character === 189 || character == 92) {
        return false;
    }
    return true;
}

function filterUnwantedChars(inputString) {
    var oldbuf = new Buffer(inputString);
    var newbuf = new Buffer(inputString.length);
    var count = 0;
    for (var i = 0; i < oldbuf.length ; i++) {
        var mychar = oldbuf[i];
        var test = asciiTest(mychar);
        if (test) {
            newbuf[count] = oldbuf[i];
            count = count + 1;
        }
    }
    return(newbuf.toString('utf8',0,count));
}

function filterBr(str) {
    var sendback = '';
    var lastposition = 0;
    var patterncheck = /<br>/g;
    var pattern = /<br>/g;
    var result;
    
    if(result = patterncheck.exec(str) == null) {
        return(str);
    }
    
    while((result = pattern.exec(str)) != null) {
        /*
        console.log("Matched '" + result[0] + "'" +
          " at position " + result.index +
          "; next search begins at " + pattern.lastIndex);
        */  
        sendback = sendback + str.substring(lastposition,result.index) + ' ';
        lastposition = pattern.lastIndex;  
    }
    return(sendback);    
}

function filterCltag(str) {
    var sendback = '';
    var lastposition = 0;
    var patterncheck = /<!-- START CLTAGS -->/g;
    var pattern = /<!-- START CLTAGS -->/g;
    
    var result;
    if(result = patterncheck.exec(str) == null) {
        return(str);
    }
    
    while((result = pattern.exec(str)) != null) {
        /*
        console.log("Matched '" + result[0] + "'" +
          " at position " + result.index +
          "; next search begins at " + pattern.lastIndex);
        */
        sendback = sendback + str.substring(lastposition,result.index) + ' ';
        lastposition = pattern.lastIndex;  
    }
    return(sendback);    
}

function telecommuteWords(str) {
    var regex = /Telecommuting is ok/g;
    if(regex.exec(str) != null) {
        return(true);
    }
    return(false);    
}

function validString(str) {
    if(str.length > 0) {
        return true;
    }
    return false;
}

var filterDescription = htmlfilters.filterDescription = function(inputString) {
    if(validString(inputString)) {
        var result = filterUnwantedChars(inputString);
        result = filterBr(result);
        result = filterCltag(result);
        return result;
    }
    return('Unable to parse job description');
}

var processDescription = htmlfilters.processDescription = function(inputString) {
    if(telecommuteWords(inputString)) {
        return(inputString);
    }
    else {
        return(filterDescription(inputString));
    }
}

}).call(this);

if(process.argv[1] === __filename) {
    var fs = require('fs'),
        htmlfilters = require('./htmlfilters');
    
    fs.readFile('htmlfiltersfile.txt', function (err, data) {
        if (err) throw err;
        var result = new Buffer(data);
        result = result.toString();
        result = htmlfilters.filterDescription(result);
        console.log(result);
    });
}
