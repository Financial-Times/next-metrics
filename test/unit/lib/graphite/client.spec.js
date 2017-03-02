'use strict';

const assert = require('chai').assert;

describe('lib/graphite/client', () => {
	let Graphite;

	beforeEach(() => {
		Graphite = require('../../../../lib/graphite/client');
	});

	it('exports a function', () => {
		assert.isFunction(Graphite);
	});

	it('has tests');

});
