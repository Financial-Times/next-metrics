exports.Proxies = {};
exports.Proxies.System = require('./system/process');
exports.Proxies.Fetch = require('./fetch');

exports.ExpressProxies = {};
exports.ExpressProxies.HttpRequest = require('./express/http-request');
exports.ExpressProxies.HttpResponse = require('./express/http-response');

exports.ConnectProxies = {};
exports.ConnectProxies.HttpRequest = require('./connect/http-request');
exports.ConnectProxies.HttpResponse = require('./connect/http-response');
exports.ConnectProxies.ProxyServer = require('./connect/proxy-server');
exports.ConnectProxies.HttpServer = require('./connect/http-server');
