'use strict';

const assert = require('chai').assert;

describe('lib/metrics/system/process', () => {
	let System;

	beforeEach(() => {
		System = require('../../../../../lib/metrics/system/process');
	});

	it('exports a function', () => {
		assert.isFunction(System);
	});

	it('has tests');

});
