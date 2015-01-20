
Last update: July 13, 2012

Clear out the old data in Redis
flushdb

Build your data in Redis by retrieving data off the internet.
n craiges.js -b   [ the b is for build ]

Move the data from redis rss to elasticsearch
n craiges.js -e   [ the e is for elasticsearch ]

If you move the data to elasticsearch you are done otherwise:

Move the data from redis rss to redis json.
n craiges.js -m   [ the m is for move ]

Write the data from Redis out to a json file.
n craig.js -j   [ the j is for json ]

Post process the json file to only include stuff in ztags.
n craig.js -p   [ the p is for post-process ]

Now the file dataset.js can get copied over to the jobs folder /public/data
Currently there is a alias that does this called gte.

--------------------------------------------------------------------

If you want to see some data from the redis client run these commands.

hget rss:craigcity:chicago {eng,web,sof}
hget city category
hget craigcity:dothan web

--------------------------------------------------------------------

This is legacy stuff but still may work...
This is for genrating out a static web page that is not part of jobs.
This needs to be worked on further, keep it here but ignore for now.

Index your data with a pattern in the job descriptions [see below]
n indexcontent.js

Build your final web page
n buildcontent.js pattern > p1.html
