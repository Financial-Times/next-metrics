'use strict';

const assert = require('chai').assert;
const mockery = require('mockery');

describe('lib/metrics', () => {
	let Graphite;
	let metrics;
	let Metrics;

	beforeEach(() => {
		metrics = require('../mock/metrics.mock');
		mockery.registerMock('metrics', metrics);

		Graphite = require('../mock/graphite.mock');
		mockery.registerMock('../lib/graphite/client', Graphite);

		Metrics = require('../../../lib/metrics');
	});

	it('exports a function', () => {
		assert.isFunction(Metrics);
	});

	it('has a full suite of tests');

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
				HOSTEDGRAPHITE_APIKEY: process.env.HOSTEDGRAPHITE_APIKEY,
				FT_GRAPHITE_APIKEY: process.env.FT_GRAPHITE_APIKEY,
				NODE_ENV: process.env.NODE_ENV
			};
			delete process.env.HOSTEDGRAPHITE_APIKEY;
			delete process.env.FT_GRAPHITE_APIKEY;
			process.env.NODE_ENV = 'test';
			instance = new Metrics();
		});

		afterEach(() => {
			process.env.HOSTEDGRAPHITE_APIKEY = originalEnv.HOSTEDGRAPHITE_APIKEY;
			process.env.FT_GRAPHITE_APIKEY = originalEnv.FT_GRAPHITE_APIKEY;
			process.env.NODE_ENV = originalEnv.NODE_ENV;
		});

		describe('when both environment variables are set', () => {

			beforeEach(() => {
				process.env.HOSTEDGRAPHITE_APIKEY = 'mock-hosted-key-env';
				process.env.FT_GRAPHITE_APIKEY = 'mock-internal-key-env';
				instance.init(options);
			});

			it('creates a Graphite client with the expected destinations', () => {
				assert.calledOnce(Graphite);
				assert.isObject(Graphite.firstCall.args[0]);
				assert.deepEqual(Graphite.firstCall.args[0].destinations, [
					{
						host: 'carbon.hostedgraphite.com',
						key: 'mock-hosted-key-env',
						port: 2003
					},
					{
						host: 'graphite.ft.com',
						key: 'mock-internal-key-env',
						port: 2003
					}
				]);
			});

		});

		describe('when only the HOSTEDGRAPHITE_APIKEY environment variable is set', () => {

			beforeEach(() => {
				process.env.HOSTEDGRAPHITE_APIKEY = 'mock-hosted-key-env';
				instance.init(options);
			});

			it('creates a Graphite client with the expected destinations', () => {
				assert.calledOnce(Graphite);
				assert.isObject(Graphite.firstCall.args[0]);
				assert.deepEqual(Graphite.firstCall.args[0].destinations, [
					{
						host: 'carbon.hostedgraphite.com',
						key: 'mock-hosted-key-env',
						port: 2003
					},
					{
						host: 'graphite.ft.com',
						key: 'mock-hosted-key-env',
						port: 2003
					}
				]);
			});

		});

		describe('when the HOSTEDGRAPHITE_APIKEY environment variable is set and FT_GRAPHITE_APIKEY is set to "false"', () => {

			beforeEach(() => {
				process.env.HOSTEDGRAPHITE_APIKEY = 'mock-hosted-key-env';
				process.env.FT_GRAPHITE_APIKEY = 'false';
				instance.init(options);
			});

			it('creates a Graphite client with the expected destinations', () => {
				assert.calledOnce(Graphite);
				assert.isObject(Graphite.firstCall.args[0]);
				assert.deepEqual(Graphite.firstCall.args[0].destinations, [
					{
						host: 'carbon.hostedgraphite.com',
						key: 'mock-hosted-key-env',
						port: 2003
					}
				]);
			});

		});

		describe('when both options are set', () => {

			beforeEach(() => {
				process.env.HOSTEDGRAPHITE_APIKEY = 'mock-hosted-key-env';
				process.env.FT_GRAPHITE_APIKEY = 'mock-internal-key-env';
				options.hostedApiKey = 'mock-hosted-key-opt';
				options.ftApiKey = 'mock-internal-key-opt';
				instance.init(options);
			});

			it('creates a Graphite client with the expected destinations', () => {
				assert.calledOnce(Graphite);
				assert.isObject(Graphite.firstCall.args[0]);
				assert.deepEqual(Graphite.firstCall.args[0].destinations, [
					{
						host: 'carbon.hostedgraphite.com',
						key: 'mock-hosted-key-opt',
						port: 2003
					},
					{
						host: 'graphite.ft.com',
						key: 'mock-internal-key-opt',
						port: 2003
					}
				]);
			});

		});

		describe('when both options are set but ftApiKey is set to `false`', () => {

			beforeEach(() => {
				process.env.HOSTEDGRAPHITE_APIKEY = 'mock-hosted-key-env';
				process.env.FT_GRAPHITE_APIKEY = 'mock-internal-key-env';
				options.hostedApiKey = 'mock-hosted-key-opt';
				options.ftApiKey = false;
				instance.init(options);
			});

			it('creates a Graphite client with the expected destinations', () => {
				assert.calledOnce(Graphite);
				assert.isObject(Graphite.firstCall.args[0]);
				assert.deepEqual(Graphite.firstCall.args[0].destinations, [
					{
						host: 'carbon.hostedgraphite.com',
						key: 'mock-hosted-key-opt',
						port: 2003
					}
				]);
			});

		});

		describe('when nothing is set and NODE_ENV is "production"', () => {

			beforeEach(() => {
				process.env.NODE_ENV = 'production';
			});

			it('throws an error', () => {
				assert.throws(() => {
					instance.init(options);
				}, 'No HOSTEDGRAPHITE_APIKEY is set. Please explicitly set to false if you don\'t wish to use Hosted Graphite.');
			});

		});

	});

});
