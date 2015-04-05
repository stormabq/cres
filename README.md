
npm install

Start up Redis

Run the following command:

```
cd cres/run
n craiges.js -b       [build]
```

Bring up Elastic by going to the elastic directory and enter

```
./bin/elasticsearch
```

```
cd cres/ruby
bash installplugin
```

* bring down es
* bring up es

```
bash startriver
cd ./../run
node craiges.js -e
```

Bring up Kibana by going to the kibana directory and enter:

```
./bin/kibana
```

Go to this
[URL]
(http://localhost:5601).


Uncheck the box *index contains time-based events*

And enter in the box index name or pattern

redis-index

and then hit the **Create** button

Get out of that page in your browser and bring it back up.
