'use strict';

const assert = require('chai').assert;

describe('lib/metrics/services', () => {
	let services;

	beforeEach(() => {
		services = require('../../../../lib/metrics/services');
	});

	it('exports an object', () => {
		assert.isObject(services);
	});

	describe('each object key', () => {
		it('is a slugified service name', () => {
			const keyRegExp = /^[a-z0-9-]+$/i;
			Object.keys(services).forEach(key => {
				// Note: we have to use `isTrue` over `match` here because
				// Chai responds with an incomprehensible error
				assert.isTrue(keyRegExp.test(key), `Key "${key}" is alphanumeric/hyphenated`);
			});
		});
	});

	describe('each object value', () => {
		it('is a regular expression', () => {
			Object.keys(services).map(key => services[key]).forEach(value => {
				assert.instanceOf(value, RegExp);
			});
		});
	});

});
