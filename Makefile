include n.Makefile

test: verify
	mocha --reporter spec -i tests

integration-test:
	export DEBUG=graphite; node examples/app.js
