### Image Proxy Service Studies

#### To start a proxy server:
```npm start```

There isn't much to configure, but if you need to, proxy-config.js is the place
```javascript
{
    port     : 8080,        // local meaning
                            // can be re-read dynamically via SIGHUP
    keepalive: true,        // set to true for performance optimization for limited distinct image servers
    admin    : true,        // allow /admin REST call
    verbose  : false
}
```
When done, press ^C

#### If you want to test the service locally, start the server in the background:
```npm start &```

#### To prepare the test environment:
```cd tests && npm install```

#### To run the tests, from either current or tests directory:

##### For a functional test
```npm test```
(see test-config.js for local vs remote target)

##### For a parallel download test:
```npm run loadtest [iterations] [local|google]``` 

Happy proxying!

Eugene Portnoy

SF Bay Area, April 7, 2017

