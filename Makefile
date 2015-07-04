
install:
	origami-build-tools install

test:
	next-build-tools verify --skip-layout-checks
	mocha --reporter spec -i tests/graphite

integration-test:
	export DEBUG=graphite; node examples/app.js

