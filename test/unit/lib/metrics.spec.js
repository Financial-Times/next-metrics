'use strict';

const assert = require('chai').assert;
const mockery = require('mockery');
const sinon = require('sinon');

describe('lib/metrics', () => {
	let clock;
	let Graphite;
	let metrics;
	let nLogger;
	let Metrics;

	beforeEach(() => {
		clock = sinon.useFakeTimers(new Date('Mon, 15 Jun 2015 20:12:01 UTC').getTime());
		metrics = require('../mock/metrics.mock');
		mockery.registerMock('metrics', metrics);

		Graphite = require('../mock/graphite.mock');
		mockery.registerMock('../lib/graphite/client', Graphite);

		nLogger = require('../mock/n-logger.mock');
		mockery.registerMock('@financial-times/n-logger', nLogger);

		Metrics = require('../../../lib/metrics');
	});

	afterEach(() => {
		clock.restore();
	});

	it('exports a function', () => {
		assert.isFunction(Metrics);
	});

	describe('key configuration', () => {
		let instance;
		let options;
		let originalEnv;

		beforeEach(() => {
			options = {
				app: 'test',
				useDefaultAggregators: false
			};
			originalEnv = {
				FT_GRAPHITE_APP_UUID: process.env.FT_GRAPHITE_APP_UUID,
				FT_GRAPHITE_APIKEY: process.env.FT_GRAPHITE_APIKEY,
				NODE_ENV: process.env.NODE_ENV
			};

			delete process.env.FT_GRAPHITE_APP_UUID;
			delete process.env.FT_GRAPHITE_APIKEY;

			process.env.NODE_ENV = 'test';

			instance = new Metrics();
		});

		afterEach(() => {
			process.env.FT_GRAPHITE_APP_UUID = originalEnv.FT_GRAPHITE_APP_UUID;
			process.env.FT_GRAPHITE_APIKEY = originalEnv.FT_GRAPHITE_APIKEY;
			process.env.NODE_ENV = originalEnv.NODE_ENV;
		});

		describe('when the FT_GRAPHITE_APP_UUID environment variable is set and NODE_ENV is "production"', () => {

			beforeEach(() => {
				process.env.NODE_ENV = 'production';
				process.env.FT_GRAPHITE_APP_UUID = 'mock-hosted-uuid-env';
				instance.init(options);
			});

			it('a Graphite client should be instantiated with an options object', () => {
				assert.calledOnce(Graphite);
				assert.isObject(Graphite.firstCall.args[0]);
			});

			it('the Graphite host should be passed to the Graphite client (opts.destination.host)', () => {
				assert.equal(Graphite.firstCall.args[0].destination.host, 'graphitev2.ft.com');
			});

			it('the Graphite API key should be passed to the Graphite client (opts.destination.key)', () => {
				assert.equal(Graphite.firstCall.args[0].destination.key, 'mock-hosted-uuid-env');
			});

			it('metric logging should be enabled for the Graphite client (opts.noLog)', () => {
				assert.isFalse(Graphite.firstCall.args[0].noLog);
			});

		});

		describe('when the FT_GRAPHITE_APP_UUID and FT_GRAPHITE_APIKEY environment variable is set and NODE_ENV is "production"', () => {

			beforeEach(() => {
				process.env.NODE_ENV = 'production';
				process.env.FT_GRAPHITE_APP_UUID = 'mock-hosted-uuid-env';
				process.env.FT_GRAPHITE_APIKEY = 'mock-hosted-apikey-env';
				instance.init(options);
			});

			it('two Graphite clients should be instantiated', () => {
				assert.calledTwice(Graphite);
				assert.isObject(Graphite.firstCall.args[0]);
				assert.isObject(Graphite.secondCall.args[0]);
			});

			it('the Graphite hosts should be passed to the Graphite clients correctly', () => {
				assert.equal(Graphite.firstCall.args[0].destination.host, 'graphitev2.ft.com');
				assert.equal(Graphite.secondCall.args[0].destination.host, 'graphite.ft.com');
			});

			it('the Graphite API keys should be passed to the Graphite clients (opts.destination.key)', () => {
				assert.equal(Graphite.firstCall.args[0].destination.key, 'mock-hosted-uuid-env');
				assert.equal(Graphite.secondCall.args[0].destination.key, 'mock-hosted-apikey-env');
			});

			it('metric logging should be enabled for the Graphite clients (opts.noLog)', () => {
				assert.isFalse(Graphite.firstCall.args[0].noLog);
				assert.isFalse(Graphite.secondCall.args[0].noLog);
			});

		});

		describe('when the FT_GRAPHITE_APP_UUID environment variable is empty and NODE_ENV is "production"', () => {

			beforeEach(() => {
				process.env.NODE_ENV = 'production';
				process.env.FT_GRAPHITE_APP_UUID = '';
				instance.init(options);
			});

			it('an error message with the event NEXT_METRICS_INVALID_PRODUCTION_CONFIG should be logged', () => {
				assert.calledOnce(nLogger.default.error);
				assert.isObject(nLogger.default.error.firstCall.args[0]);
				assert.equal(nLogger.default.error.firstCall.args[0].event, 'NEXT_METRICS_INVALID_PRODUCTION_CONFIG');
			});

		});

		describe('when the FT_GRAPHITE_APP_UUID environment variable is not set and NODE_ENV is "production"', () => {

			beforeEach(() => {
				process.env.NODE_ENV = 'production';
				instance.init(options);
			});

			it('an error message with the event NEXT_METRICS_INVALID_PRODUCTION_CONFIG should be logged', () => {
				assert.calledOnce(nLogger.default.error);
				assert.isObject(nLogger.default.error.firstCall.args[0]);
				assert.equal(nLogger.default.error.firstCall.args[0].event, 'NEXT_METRICS_INVALID_PRODUCTION_CONFIG');
			});

		});

		describe('when the FT_GRAPHITE_APP_UUID environment variable is set to "false"', () => {

			beforeEach(() => {
				process.env.FT_GRAPHITE_APP_UUID = 'false';
				instance.init(options);
			});

			it('a Graphite client should be instantiated with an options object', () => {
				assert.calledOnce(Graphite);
				assert.isObject(Graphite.firstCall.args[0]);
			});
			it('the destination option passed to the Graphite client should be empty (opts.destination)', () => {
				assert.isEmpty(Graphite.firstCall.args[0].destination);
			});
			it('metric logging should be disabled for the Graphite client (opts.noLog)', () => {
				assert.isTrue(Graphite.firstCall.args[0].noLog);
			});
			it('an info message with the event NEXT_METRICS_DISABLED should be logged', () => {
				assert.calledOnce(nLogger.default.info);
				assert.isObject(nLogger.default.info.firstCall.args[0]);
				assert.equal(nLogger.default.info.firstCall.args[0].event, 'NEXT_METRICS_DISABLED');
			});

		});

		describe('when the FT_GRAPHITE_APP_UUID environment variable is set in a non-production environment', () => {

			beforeEach(() => {
				process.env.FT_GRAPHITE_APP_UUID = 'mock-hosted-uuid-env';
				instance.init(options);
			});

			it('a Graphite client should be instantiated with an options object', () => {
				assert.calledOnce(Graphite);
				assert.isObject(Graphite.firstCall.args[0]);
			});
			it('the destination option passed to the Graphite client should be empty (opts.destination)', () => {
				assert.isEmpty(Graphite.firstCall.args[0].destination);
			});
			it('metric logging should be disabled for the Graphite client (opts.noLog)', () => {
				assert.isTrue(Graphite.firstCall.args[0].noLog);
			});

		});

		describe('when the FT_GRAPHITE_APP_UUID environment variable is not set in a non-production environment', () => {

			beforeEach(() => {
				instance.init(options);
			});

			it('a Graphite client should be instantiated with an options object', () => {
				assert.calledOnce(Graphite);
				assert.isObject(Graphite.firstCall.args[0]);
			});
			it('the destination option passed to the Graphite client should be empty (opts.destination)', () => {
				assert.isEmpty(Graphite.firstCall.args[0].destination);
			});
			it('metric logging should be disabled for the Graphite client (opts.noLog)', () => {
				assert.isTrue(Graphite.firstCall.args[0].noLog);
			});

		});

	});

});
