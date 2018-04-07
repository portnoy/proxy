/*
 * Written for proxy.co by EP
 * April 1, 2018
 *
 * config for proxy.js
 */
module.exports = {
    port     : 8081,        // port isn't really re-readable, but others can be changed followed by SIGHUP
    host     : 'localhost', // not used by the app itself; change to test remotely
    keepalive: true,        // set to true for performance optimization for limited distinct image servers
    admin    : true,        // allow /admin REST call
    verbose  : false
}
