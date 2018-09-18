'use strict';

const assert = require('chai').assert;

describe('lib/metrics/express/http-response', () => {
	let HttpResponse;

	beforeEach(() => {
		HttpResponse = require('../../../../../lib/metrics/express/http-response');
	});

	it('exports a function', () => {
		assert.isFunction(HttpResponse);
	});

});
