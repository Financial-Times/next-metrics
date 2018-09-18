'use strict';

const assert = require('chai').assert;

describe('lib/metrics/express/http-request', () => {
	let HttpRequest;

	beforeEach(() => {
		HttpRequest = require('../../../../../lib/metrics/express/http-request');
	});

	it('exports a function', () => {
		assert.isFunction(HttpRequest);
	});

});
