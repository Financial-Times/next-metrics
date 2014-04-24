'use strict';

var express			= require('express'),
	mware			= require('./middleware.js'),
	mustache		= require('hogan-express'),
	compression		= require('compression')(),
	cookieParser	= require('cookie-parser'),
	cookieSession	= require('cookie-session'),
	config			= require('./config.js');

var app = express();

// Enable output compression
app.use(compression);

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

// Setup the routes
app.get('/', function (req, res) {
	res.render('body', {title: 'Hello world', content: 'Hello worlds'});
});

app.get('/__health', require('./controllers/health'));
app.get('/__metrics', require('./controllers/metrics'));

app.listen(config.PORT);
console.log('Up and running on port', config.PORT);