'use strict';

const assert = require('chai').assert;

describe('lib/metrics', () => {
	let Metrics;

	beforeEach(() => {
		Metrics = require('../../../lib/metrics');
	});

	it('exports a function', () => {
		assert.isFunction(Metrics);
	});

	it('has tests');

});
