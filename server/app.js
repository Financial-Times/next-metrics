'use strict';

var express         = require('express'),
    middleware      = require('./middleware.js'),
    mustache        = require('hogan-express'),
    os              = require('os'),
    compression     = require('compression')(),
    cookieParser    = require('cookie-parser'),
    cookieSession   = require('cookie-session'),
    config          = require('./config.js'),
    ftApi           = require('ft-api-client'),
    flags           = require('./flags');

var app = express();

// Enable output compression
app.use(compression);

// Set CORS headers
app.use(middleware.allowCrossDomain);

// Enable secure cookies
app.use(cookieParser());
app.use(cookieSession({ path: '/', httpOnly: true, maxAge: config.COOKIE_AGE, secret: config.COOKIE_SECRET})); // SET A NEW SECRET

// Using mustache via Hogan
app.set('view engine', 'mustache');

// Set the default, parent template
app.set('layout', 'layout');

// Set the partials available to all templates
app.set('partials', {header: 'partials/header', head: 'partials/head', footer: 'partials/footer'});

// Set the default location for templates
app.set('views', 'templates');

// Set mustache (hogan) as the rendering engine
app.engine('mustache', mustache);

// Static resources folder
app.use(express.static('./static'));

var ft = new ftApi({ apiKey: process.env.FT_API_KEY });

var flagUrl = 'http://' + os.hostname() + ':' + config.PORT + '/__flags';

console.log(flagUrl);
flags.hydrate(flagUrl);

// Setup the routes
app.get('/', function (req, res) {
    res.render('body', {title: 'Hello world', content: 'Hello worlds', flags: flags.get() });
});

app.get('/news/:id', function (req, res) {
    ft.getItem(req.params.id, function (err, response) {
        if (err) {
            res.send(404, err);
        } else {
            res.render('body', {
                title: response.item.title.title,
                content: response.item.body.body
            });
        }
    });
});

// dummy flag service
app.get('/__flags', function (req, res) {
    res.send(200, '{ "foo": true, "boo": false }');
});
app.get('/__health', require('./controllers/health'));
app.get('/__metrics', require('./controllers/metrics'));

app.listen(config.PORT);
console.log('Up and running on port', config.PORT);
