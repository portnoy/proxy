/*
 * 
 * Written for proxy.co by EP
 * April 4, 2018
 *
 */ 
const async = require('async');
const expect = require('chai').expect;

const getUser = require('./index').getUser;

describe('Connectivity test:', () => {
  it('Should get a user by Github username', () => {
    return getUser('portnoy')
      .then(response => {
        expect(typeof response).to.equal('object');
        expect(response.name).to.equal('Eugene Portnoy')
        expect(response.company).to.equal('P**xy');     // Peaxy or Proxy?
      });
  });
});

const getReq = require('./index').getReq;
const headReq = require('./index').headReq;

var config = require('./test-config');

const port = process.env.PORT || config.test.port;
const proxy = config.test.proto + config.test.host + port;
console.log('Testing proxy service on', proxy);

describe('Negative tests:', () => {
  let tests = [
      { arg: 'https://proxy.co/nifigatutnet.png',    method: getReq,  path: '/image?url=', expected: 404 } ,
      { arg: 'https://proxy.co/favicon.png',         method: getReq,  path: '/photo?url=', expected: 404 } ,
      { arg: 'https://proxy.co/favicon.png',         method: getReq,  path: '/image?key=', expected: 400 } ,
      { arg: 'ftp://proxy.co/favicon.png',           method: getReq,  path: '/image?key=', expected: 400 } ,
      { arg: 'https://proxy.co/favicon.png',         method: headReq, path: '/image?url=', expected: 405 } ,
      { arg: "https://proxy.co/'';!--\"<XSS>=&{()}", method: getReq,  path: '/image?url=', expected: 404 } ,
  ];
  async.map(tests, (test) => {
      let badurl = proxy + test.path + test.arg + encodeURIComponent(test.arg);
      it('should fail ' + test.arg + ' with ' + test.expected, () => {
        return test.method(badurl)
          .then(response => {
              expect(typeof response).to.equal('object');
              expect(response.status).to.equal(test.expected);
          }).catch((err) => {
            expect(typeof err.response).to.equal('object');
            expect(err.response.status).to.equal(test.expected);
          });
      });
  });
});

describe('Empty Page Test:', () => {
  it('should return 200 for /', () => {
	return getReq(proxy + '/')
	  .then(response => {
		  expect(typeof response).to.equal('object');
		  expect(response.status).to.equal(200);
		  expect(response.data.length).to.equal(0);
	  });
  });
});

// compare response headers recieved directly to ones we got via the proxy
describe('Download Images Test:', () => {
  let saved = [];
  let date = {};
  const headers = ['content-length', 'content-type', 'content-disposition', 'server'];

  const tests = [
      { arg: 'https://proxy.co/favicon.png', expected: 200 } ,
      { arg: 'http://freefrom.net/yuna/thumbs/IMG_0210.JPG', expected: 200 } ,
      { arg: 'https://www.schneier.com/images/bruce-blog3.jpg', expected: 200 } ,
    ];
    async.map(tests, (test) => {
      it('should download ' + test.arg + ' directly', () => {
        return getReq(test.arg)
          .then(response => {
              expect(typeof response).to.equal('object');
              expect(response.status).to.equal(test.expected);
              headers.forEach( (hdr) => (saved[hdr] = response.headers[hdr] ) );
              date = Date.parse(response.headers.date);
          });
      });
        
      it('should download it via proxy.js', () => {
        imageurl = proxy + '/image?url=' + encodeURIComponent(test.arg);
        return getReq(imageurl)
          .then(response => {
              expect(typeof response).to.equal('object');
              expect(response.status).to.equal(test.expected);
              headers.forEach( (hdr) => expect(response.headers[hdr]).to.equal(saved[hdr]) );
              expect(Date.parse(response.headers.date)).to.be.at.least(date);
          });
      });
    });
});

describe('Stats Page Test:', () => {
  it('should display proxy stats above', () => {
	return getReq(proxy + '/admin')
	  .then(response => {
		  expect(typeof response).to.equal('object');
		  expect(response.status).to.equal(200);
          console.log(response.data);
	  });
  });
});


