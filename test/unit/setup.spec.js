'use strict';

const assert = require('chai').assert;
const quibble = require('quibble');
const sinon = require('sinon');

sinon.assert.expose(assert, {
	includeFail: false,
	prefix: ''
});

afterEach(() => {
	quibble.reset();
});
