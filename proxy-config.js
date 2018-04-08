/*
 * Written for proxy.co by EP
 * April 1, 2018
 *
 * config for proxy.js
 */

module.exports = {
  port      : 8080,   // local meaning
                      // can be re-read dynamically via SIGHUP
  keepalive : true,   // set to true for performance optimization for limited distinct image servers
  admin     : true,   // allow /admin REST call
  verbose   : false,  // console log clt requests
};
