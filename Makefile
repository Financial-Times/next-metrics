install:
	origami-build-tools install
test:
	next-build-tools verify;

integration-test:
	export DEBUG=graphite; node examples/app.js

