'use strict';

const assert = require('chai').assert;

describe('lib/metrics/fetch', () => {
	let Fetch;

	beforeEach(() => {
		Fetch = require('../../../../lib/metrics/fetch');
	});

	it('exports a function', () => {
		assert.isFunction(Fetch);
	});

	it('has tests');

});
