'use strict';

const assert = require('chai').assert;
const mockery = require('mockery');
const sinon = require('sinon');

describe('index', () => {
	let Metrics;
	let mockMetrics;
	let nextMetrics;
	let services;

	beforeEach(() => {
		mockMetrics = {isMockMetricsInstance: true};
		Metrics = sinon.stub().returns(mockMetrics);
		mockery.registerMock('./lib/metrics', Metrics);

		services = sinon.stub();
		mockery.registerMock('./lib/metrics/services', services);

		nextMetrics = require('../..');
	});

	it('creates a new Metrics instance', () => {
		assert.calledOnce(Metrics);
		assert.calledWithNew(Metrics);
		assert.calledWithExactly(Metrics);
	});

	it('exports the new Metrics instance', () => {
		assert.strictEqual(nextMetrics, mockMetrics);
	});

	it('has a `services` property which aliases lib/metrics/services', () => {
		assert.strictEqual(nextMetrics.services, services);
	});

	it('has a `Metrics` property which aliases lib/metrics', () => {
		assert.strictEqual(nextMetrics.Metrics, Metrics);
	});

});
