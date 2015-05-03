
install:
	origami-build-tools install

test:
	mocha --reporter spec -i tests/graphite

integration-test:
	export DEBUG=graphite; node examples/app.js

