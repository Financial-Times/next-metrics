test: 
	@./node_modules/.bin/mocha -R spec tests/routing.js
	@./node_modules/.bin/mocha -R spec tests/serviceUnavailable.js

run:
	@node proxy.js
