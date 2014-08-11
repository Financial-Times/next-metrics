'use strict';

var express         = require('express'),
    middleware      = require('./middleware.js'),
    compression     = require('compression')(),
    resolveRoute   = require('./controllers/resolveRoute.js'),
    config          = require('./config.js');

var app = express();

// Setup the routes
var router = express.Router();
router.use(resolveRoute);
app.use('/', router);

// Enable output compression
app.use(compression);

// Set CORS headers
app.use(middleware.allowCrossDomain);

// Utility end points
app.get('/__health', require('./controllers/health'));
app.get('/__metrics', require('./controllers/metrics'));

app.listen(config.PORT);
console.log('Up and running on port', config.PORT);
