'use strict';

// Poll for profile data, it will come in repeatedly
var ServiceCollection = require('./models/service/collection');
var config = require('./server/config.js');
var fs = require('fs');
var services = null;

var serviceProfiles = require('./server/serviceProfiles.js');
serviceProfiles.getServiceProfiles({
    url: config.SERVICE_PROFILE_URL,
    cb: function (profileData) {
        services = new ServiceCollection(profileData);
    }
});

// Setup the http servers
var httpProxy = require('http-proxy'),
    proxy = httpProxy.createProxyServer(),
    router = require('./models/route'),
    http = require('http'),
    debug = require('debug')('proxy'),
    Metrics = require('./lib/metrics'),
    metrics = new Metrics({ 
        flushEvery: 5000
    });

proxy.on('proxyRes', function(proxyReq, req, res, options) {
    res.setHeader('Vary', 'Accept-Encoding, X-Version');
});

var server = http.createServer(function(req, res) {

    /* mock backend code for purpose of benchmarking
     nock('http://next-router-test-app-badger-1.herokuapp.com')
      .get('/badger')
      .delayConnection(parseInt(Math.random(3000)*1000))
      .reply(200, '');
    */

    // instrument the req & response object 
    metrics.instrument(req, { as: 'http.req' });
    metrics.instrument(res, { as: 'http.res' });

    // If we have no service data then don't even try to route a request. Seriously don't.
    if (!services) {
        debug('No service profile data ' + req.url);
        res.writeHead(503, { 'Retry-After': '10' });
        res.end();
        return;
    }

    // Used by Varnish to determine readiness to serve traffic
    if (req.url === '/__gtg') {
        res.writeHead(200, { 'Cache-Control': 'no-cache' });
        res.end();
        return;
    }
    
    // A landing/information page
    if (req.url === '/') {
        res.writeHead(200, { 'Cache-Control': 'no-cache' });
        res.write(fs.readFileSync('views/index.html', { 'encoding': 'utf-8' }));
        res.end();
        return;
    }

    res.oldWriteHead = res.writeHead;
    res.writeHead = function(statusCode, headers) {
        var current = res.getHeader('Vary');
        var vary = (current) ? current + ', X-Version' : 'X-Version';
        res.setHeader('Vary', vary);
        res.oldWriteHead(statusCode, headers);
    };

    // 1. Acquire service version
    var version = router(req, res, services);

     if (version) { 
        
        var node = version.nodes[0],
            url = node;
        
        debug('Proxying request to: ' + url + req.url);

        req.headers.host = node.replace('http://', '');
        res.setHeader('X-Version', version.id);
        
        // 2. Proxy to it
        proxy.proxyRequest(req, res, { 
            target: url,
            port: 80,
            timeout: 1000 // FIXME Fairly arbitrary ATM - would like it to be 2000ms
        });

    } else {
        
        // 3. Or failing that, we probably don't know about the route
        debug('Route not found: ' + req.url);
        res.writeHead(404);
        res.end(); 
    }

});

proxy.on('error', function(e) {
    console.error(e);
});

metrics.instrument(proxy, { 'as': 'http.proxy' });
metrics.instrument(server, { 'as': 'http.server' });

if (!module.parent) { 
    var port = Number(process.env.PORT || 5050);
    server.listen(port, function () {
        console.log('Up and running on port', 5050);
    });
} else {
    module.exports = server;
}

