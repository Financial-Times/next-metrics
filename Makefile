
install:
	npm install origami-build-tools
	obt install

test:
	nbt verify --skip-layout-checks --skip-dotenv-check
	mocha --reporter spec -i tests/graphite

integration-test:
	export DEBUG=graphite; node examples/app.js

