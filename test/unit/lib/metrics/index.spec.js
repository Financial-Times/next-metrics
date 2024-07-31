'use strict';

const assert = require('chai').assert;
const quibble = require('quibble');
const sinon = require('sinon');

describe('lib/metrics/index', () => {
	let Fetch;
	let HttpRequest;
	let HttpResponse;
	let index;
	let System;

	beforeEach(() => {
		Fetch = sinon.stub();
		quibble('../../../../lib/metrics/fetch', Fetch);

		HttpRequest = sinon.stub();
		quibble('../../../../lib/metrics/express/http-request', HttpRequest);

		HttpResponse = sinon.stub();
		quibble('../../../../lib/metrics/express/http-response', HttpResponse);

		System = sinon.stub();
		quibble('../../../../lib/metrics/system/process', System);

		index = require('../../../../lib/metrics/index');
	});

	it('exports an object', () => {
		assert.isObject(index);
	});

	it('has a `Fetch` property which aliases lib/metrics/fetch', () => {
		assert.strictEqual(index.Fetch, Fetch);
	});

	it('has a `HttpRequest` property which aliases lib/metrics/express/http-request', () => {
		assert.strictEqual(index.HttpRequest, HttpRequest);
	});

	it('has a `HttpResponse` property which aliases lib/metrics/express/http-response', () => {
		assert.strictEqual(index.HttpResponse, HttpResponse);
	});

	it('has a `System` property which aliases lib/metrics/system/process', () => {
		assert.strictEqual(index.System, System);
	});

});
