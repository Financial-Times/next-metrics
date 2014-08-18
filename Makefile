test: 
	@./node_modules/.bin/mocha -R spec tests/routing.js

run:
	@node server/proxy.js
