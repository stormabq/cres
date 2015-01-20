
#### How to Install Kibana from Github


On a clean clone from github remove .ruby-version

If you don’t have this gemset installed locally then:

```
rvm gemset create kibana
rvm gemset use kibana
bundle install
```

```
npm install
bower install
npm install -D load-grunt-config
```

And finally to bring up Kibana:

```
grunt dev
```
