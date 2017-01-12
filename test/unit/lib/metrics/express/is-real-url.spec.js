'use strict';

const assert = require('chai').assert;

describe('lib/metrics/express/http-response', () => {
	let isRealUrl;

	beforeEach(() => {
		isRealUrl = require('../../../../../lib/metrics/express/is-real-url');
	});

	it('exports a function', () => {
		assert.isFunction(isRealUrl);
	});

	describe('isRealUrl(path)', () => {

		describe('when `path` is a regular path', () => {
			it('returns `true`', () => {
				const paths = [
					'/',
					'/foo',
					'/foo/bar'
				];
				paths.forEach(path => {
					assert.isTrue(isRealUrl(path), `Path "${path}" is a real URL`);
				});
			});
		});

		describe('when `path` is an internal path that shouldn\'t be instrumented', () => {
			it('returns `false`', () => {
				const paths = [
					'/__about',
					'/__brew-coffee',
					'/__dependencies',
					'/__gtg',
					'/__health',
					'/__sensu'
				];
				paths.forEach(path => {
					assert.isFalse(isRealUrl(path), `Path "${path}" is not a real URL`);
				});
			});
		});

	});

});
