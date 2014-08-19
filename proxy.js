'use strict';

var httpProxy = require('http-proxy'),
    proxy = httpProxy.createProxyServer(),
    router = require('./models/route'),
    http = require('http'),
    debug = require('debug')('proxy');

    proxy.on('proxyRes', function(proxyReq, req, res, options) {
        res.setHeader('Vary', 'Accept-Encoding, X-Version');
    });

    var server = http.createServer(function(req, res) {
    
        res.oldWriteHead = res.writeHead;
        res.writeHead = function(statusCode, headers) {
            var current = res.getHeader('Vary');
            var vary = (current) ? current + ', X-Version' : 'X-Version';
            res.setHeader('Vary', vary);
            res.oldWriteHead(statusCode, headers);
        };

        // 1. Acquire service version
        var version = router(req, res);

        if (version) { 
            
            var node = version.nodes[0],
                url = 'http://' + node;
            
            debug('Proxying request to: ' + url + req.url);
            req.headers.host = node;
            res.setHeader('X-Version', version.id);
            
            // 2. Proxy to it
            proxy.proxyRequest(req, res, { 
                target: url,
                port: 80,
                host: node,
                timeout: 5000 // FIXME Fairly arbitrary ATM - would like it to be 2000ms
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


if (!module.parent) { 
    var port = Number(process.env.PORT || 5050);
    server.listen(port, function () {
        console.log('Up and running on port', 5050);
    });
} else {
    module.exports = server;
}

