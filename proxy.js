/*
 * Written for proxy.co by EP
 * April 1, 2018
 *
 * Implement and deploy a web service for proxying remote images.
 * Use cases for such a service may include displaying embedded images in a chat or email web client...
 *
 * https://gist.github.com/simonratner/609a8ca988586087aeade9f156da7759
 */
'use strict';
const http = require('http');
const https = require('https');
const url = require('url');

// primitive proxy statistics. TODO: move to a separate module
class ProxyStats {
    constructor()  {
        this.outstanding = 0;
        this.outstandingHWM = 0; // high watermark
        this.total = 0;
        this.completed = 0;
        this.errors = {};
    }
    inc()       { if (++this.outstanding > this.outstandingHWM) this.outstandingHWM++; }
    dec()       { this.outstanding-- };
    inctotal()  { this.total++; }
    complete()  { this.dec(); this.completed++; };

    logerr(e, msg) {
        this.errors[e] = 1 + (this.errors[e] ? this.errors[e] : 0);
        if (!msg) msg = e.toString();
        console.log('[E]: ' + e + ' ' + msg);
    };
    print() { return JSON.stringify(this, null, 4); }
}

// Configuration
var config = require('./proxy-config');
if (config.keepalive) {
    var agent = new http.Agent({keepAlive: true, keepAliveMsecs: 30000});
    var sagent = new https.Agent({keepAlive: true, keepAliveMsecs: 30000});
}

// the server
const proxy = http.createServer( (cltreq, cltrsp) => {

    // filter hop-by-hop headers: isn't it what proxies are expected to do?
    const disallowed = ['connection', 'keep-alive', 'TE'];
    function filtered(raw) {
        if (typeof raw !== "object") return raw;
        // TODO RFC2616 section '14.10 Connection' mandates:
        // HTTP/1.1 proxies MUST parse the Connection header field before a message is forwarded and, for each
        // connection-token in this field, remove any header field(s) from the message with the same name as the token.
        return Object.keys(raw)
            .filter(key => !disallowed.includes(key))
            .reduce((obj, key) => (obj[key] = raw[key], obj) , {});
    }

    function forwardRequest(uri) {
        const imgurl = url.parse(uri);
        if (imgurl.protocol !== 'http:' && imgurl.protocol !== 'https:') {
            pstats.logerr(400, 'Unsupported protocol ' + imgurl.protocol);
            cltrsp.writeHead(400, {'Content-Type': 'text/plain'});
            return cltrsp.end('');
        }
        pstats.inc();
        cltreq.headers.host = imgurl.hostname;
        let fwdopt = {
            host: imgurl.hostname,
            path: imgurl.path,
            port: imgurl.port,
            headers: filtered(cltreq.headers)
        };
        if (config.verbose)
            console.log("REQ: " + JSON.stringify(fwdopt, null, 4));
        if (config.keepalive)
            fwdopt.agent = (imgurl.protocol === 'https:') ? sagent : agent;

        const get = (imgurl.protocol === 'https:') ? https.get : http.get;
        const proxyreq = get(fwdopt, (proxyrsp) => {

            cltrsp.writeHead(proxyrsp.statusCode, filtered(proxyrsp.headers));
            if (proxyrsp.statusCode >= 400) {
                pstats.logerr(proxyrsp.statusCode, fwdopt.host + fwdopt.path + ': ' + proxyrsp.statusMessage);
            }
            // to do any interesting stuff like classifying or malware sanitizing, we need to accumulate the data,
            // but it contradicts the spec, specifically memory requirements
            proxyrsp.on('data', (chunk)  => cltrsp.write(chunk, 'binary'));
            proxyrsp.on('end', () => {
                pstats.complete();
                cltrsp.end();
            });
            proxyrsp.on('error', () => {
                pstats.logerr(500, 'Remote Server Error');
                pstats.dec();
                cltrsp.end();
            });
        });

        proxyreq.on('error', function(e) {
            pstats.logerr(e.code >= 500 ? e.code : 500, 'Remote Server Error ' + e.message);
            cltrsp.end();
        });
    }

    // router
    switch (cltreq.method) {
        case 'GET':
            const tgturl = url.parse(`http://${cltreq.url}`);
            if (config.admin) {
                if (tgturl.path === '/admin') {
                    cltrsp.writeHead(200, {'Content-Type': 'application/json'});
                    return cltrsp.end(pstats.print());
                }
            }
            if (tgturl.path === '/') {
                cltrsp.writeHead(200, {'Content-Type': 'text/plain'});
                return cltrsp.end('');
            }
            pstats.inctotal(); // do not count '/' and '/admin' above
            if (tgturl.pathname === '/image') {
                const params = new url.URLSearchParams(tgturl.search);
                const link = params.get('url');
                if (link) {
                    return forwardRequest(link, cltrsp);    // <-- here we forward the requests
                }
                pstats.logerr(400, 'Malformed request');
                cltrsp.writeHead(400, { 'Content-Type': 'text/plain' });
                return cltrsp.end('');
            }
            pstats.logerr(404, "Path " + tgturl.pathname + ": Not Found\n");
            cltrsp.writeHead(404, { 'Content-Type': 'text/plain' });
            return cltrsp.end('');

        default:
            pstats.logerr(405, "Unsupported method " + cltreq.method);
            cltrsp.writeHead(405, { 'Content-Type': 'text/plain' });
            return cltrsp.end('');
    }
});

let pstats = new ProxyStats();

// reload config on SIGHUP
process.on('SIGHUP', () => {
    delete require.cache[require.resolve('./proxy-config.json')];
    config = require('./proxy-config.js');
});
// print statistics on SIGINT and SIGTERM
process.on('SIGINT', () => {
    console.log(JSON.stringify(pstats, null, 4));
    process.exit(0);
});
process.on('SIGTERM', () => {
    proxy.close(function () {
        console.log(JSON.stringify(pstats, null, 4));
        process.exit(1);
    });
});
// handle server start errors
proxy.on('error', (e) => {
    console.log("[E]: " + (e.code === 'EADDRINUSE') ? config.port + " already in use" : e.code);
    process.exit(9);
});

proxy.listen(process.env.PORT || config.port, ()  => {
    const port = proxy.address().port;
    console.log(`Proxy listening on port ${port}`);
});

