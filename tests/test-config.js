/*
 * Written for proxy.co by EP
 * April 2, 2018
 *
 * config for proxy.js tests
 */

conf = {
    local : {
        proto    : 'http://',
        host     : 'localhost',
        port     : ':8080',
    },
    google: {
        proto    : 'https://',
        host     : 'proxy-3030.appspot.com',
        port     : '',
    },
}

//  quick and dirty toggle between local/remote test targets below
module.exports = {
     // test: conf.local
     test: conf.google
}

