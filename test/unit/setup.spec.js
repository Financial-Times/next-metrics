'use strict';

const assert = require('chai').assert;
const mockery = require('mockery');
const sinon = require('sinon');

sinon.assert.expose(assert, {
	includeFail: false,
	prefix: ''
});

beforeEach(() => {
	mockery.enable({
		useCleanCache: true,
		warnOnUnregistered: false,
		warnOnReplace: false
	});
});

afterEach(() => {
	mockery.deregisterAll();
	mockery.disable();
});
