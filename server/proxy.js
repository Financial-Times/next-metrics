
var httpProxy = require('http-proxy');
var proxy = httpProxy.createProxyServer({});
var router = require('../models/route.js');

// 1. figure our route
// 2. give it to the proxy server

var server = require('http').createServer(function(req, res) {

        var app = router(req, res);

        if (app) { 
            var url = 'http://' + app.nodes[0];
            req.headers.host = app.nodes[0];
            console.log('Proxying request to', url);
            res.setHeader('x-version', app.id)
            proxy.proxyRequest(req, res, { 
                target: url,
                port: 80,
                host: app.nodes[0]
            });

        } else {
            
            console.log('Route not found', req.url);
            res.writeHead(404);
            res.end(); 
        }

    });

proxy.on('error', function(e) {
    console.error(e);
});

if (!module.parent) { 
    server.listen(5050);
    console.log('Up and running on port', 5050);
} else {
    module.exports = server;
}

