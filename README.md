### Image Proxy Service Studies

##### To start a proxy server:
npm start

There isn't much to configure, but if you need to, proxy-config.js is the place
```javascript
{
  port     : 8888,      // the service listens on
  host     : localhost, // host is used by testing scripts only
  keepalive: true,      // optimize for limited distinct image servers (expected)
  admin    : true,      // allow /admin REST call
  verbose  : false      // console.log reguests  
}
```
When done, press ^C

##### If you want to test the service locally, start the server in the background:
npm start &

##### To prepare the test environment:
cd tests && npm install

##### To run the tests, from either current or tests directory:

###### For a functional test
npm test

###### For a parallel download test:
npm run loadtest <iterations>

Happy proxying,
-- Eugene Portnoy

April 7, 2017

