'use strict';

const assert = require('chai').assert;
const mockery = require('mockery');
const sinon = require('sinon');

describe('lib/metrics/system/process', () => {
	let metrics;
	let os;
	let System;

	beforeEach(() => {
		os = require('../../../mock/os.mock');
		mockery.registerMock('os', os);

		metrics = require('../../../mock/metrics.mock');
		mockery.registerMock('metrics', metrics);

		System = require('../../../../../lib/metrics/system/process');
	});

	it('exports a function', () => {
		assert.isFunction(System);
	});

	describe('new System()', () => {
		let mockCounts;
		let countsBind;
		let instrument;
		let instance;

		beforeEach(() => {
			mockCounts = [
				{id: 1, count: 5},
				{id: 2, count: 10},
				{id: 3, count: 15},
				{id: 4, count: 20}
			];
			metrics.Counter.onCall(0).returns(mockCounts[0]);
			metrics.Counter.onCall(1).returns(mockCounts[1]);
			metrics.Counter.onCall(2).returns(mockCounts[2]);
			metrics.Counter.onCall(3).returns(mockCounts[3]);

			instrument = sinon.stub(System.prototype, 'instrument');
			countsBind = sinon.spy(System.prototype.counts, 'bind');
			instance = new System();
			instrument.restore();
			countsBind.restore();
		});

		it('has a `nodeVersion` property containing the Node.js version split into properties', () => {
			const version = process.version.match(/^v(\d+)\.(\d+)\.(\d+)$/);
			assert.deepEqual(instance.nodeVersion, {
				major: parseInt(version[1], 10),
				minor: parseInt(version[2], 10),
				patch: parseInt(version[3], 10)
			});
		});

		it('creates Counter and Histogram objects', () => {
			assert.callCount(metrics.Counter, 4);
			assert.calledWithNew(metrics.Counter.getCall(0));
			assert.calledWithNew(metrics.Counter.getCall(1));
			assert.calledWithNew(metrics.Counter.getCall(2));
			assert.calledWithNew(metrics.Counter.getCall(3));
			assert.callCount(metrics.Histogram.createUniformHistogram, 1);
			assert.calledWithNew(metrics.Histogram.createUniformHistogram.getCall(0));
		});

		it('has a `counters` property containing the created Counter and Histogram objects', () => {
			assert.strictEqual(instance.counters['system.process.mem_process_rss'], mockCounts[0]);
			assert.strictEqual(instance.counters['system.process.mem_process_heapTotal'], mockCounts[1]);
			assert.strictEqual(instance.counters['system.process.mem_process_heapUsed'], mockCounts[2]);
			assert.strictEqual(instance.counters['system.process.load_average_1m'], mockCounts[3]);
			assert.strictEqual(instance.counters['system.process.next_tick'], metrics.mockHistogram);
		});

		it('binds the `count` method to the instance', () => {
			assert.calledOnce(countsBind);
			assert.calledWithExactly(countsBind, instance);
		});

		it('calls the `instrument` method', () => {
			assert.calledOnce(instrument);
			assert.calledWithExactly(instrument);
		});

		it('has a `counts` method', () => {
			assert.isFunction(instance.counts);
		});

		describe('.counts()', () => {
			let mockPercentiles;
			let returnValue;

			beforeEach(() => {
				sinon.stub(process, 'uptime').returns(12345);
				mockPercentiles = [];
				mockPercentiles[0.5] = 123;
				mockPercentiles[0.95] = 456;
				mockPercentiles[0.99] = 789;
				metrics.mockHistogram.percentiles.returns(mockPercentiles);
				returnValue = instance.counts();
			});

			afterEach(() => {
				process.uptime.restore();
			});

			it('gets the expected histogram mean, percentiles, and stdDev values', () => {
				assert.calledOnce(metrics.mockHistogram.mean);
				assert.calledOnce(metrics.mockHistogram.percentiles);
				assert.calledWith(metrics.mockHistogram.percentiles, [0.5, 0.95, 0.99]);
				assert.calledOnce(metrics.mockHistogram.stdDev);
			});

			it('gets the process uptime', () => {
				assert.calledOnce(process.uptime);
				assert.calledWithExactly(process.uptime);
			});

			it('gets the OS CPUs', () => {
				assert.calledOnce(os.cpus);
				assert.calledWithExactly(os.cpus);
			});

			it('returns an object', () => {
				assert.isObject(returnValue);
			});

			describe('returned object', () => {

				it('has a `system.os.cpus` property set to the number of available CPUs', () => {
					assert.strictEqual(returnValue['system.os.cpus'], os.mockCpus.length);
				});

				it('has a `system.process.uptime` property set to the process uptime', () => {
					assert.strictEqual(returnValue['system.process.uptime'], 12345);
				});

				it('has a `system.process.version.major` property set to the major Node.js version', () => {
					assert.strictEqual(returnValue['system.process.version.major'], instance.nodeVersion.major);
				});

				it('has a `system.process.version.minor` property set to the minor Node.js version', () => {
					assert.strictEqual(returnValue['system.process.version.minor'], instance.nodeVersion.minor);
				});

				it('has a `system.process.version.patch` property set to the patch Node.js version', () => {
					assert.strictEqual(returnValue['system.process.version.patch'], instance.nodeVersion.patch);
				});

				it('has a `system.process.mem_process_rss` property set to the relevant counter value', () => {
					assert.strictEqual(returnValue['system.process.mem_process_rss'], instance.counters['system.process.mem_process_rss'].count);
				});

				it('has a `system.process.mem_process_heapTotal` property set to the relevant counter value', () => {
					assert.strictEqual(returnValue['system.process.mem_process_heapTotal'], instance.counters['system.process.mem_process_heapTotal'].count);
				});

				it('has a `system.process.mem_process_heapUsed` property set to the relevant counter value', () => {
					assert.strictEqual(returnValue['system.process.mem_process_heapUsed'], instance.counters['system.process.mem_process_heapUsed'].count);
				});

				it('has a `system.process.load_average_1m` property set to the relevant counter value', () => {
					assert.strictEqual(returnValue['system.process.load_average_1m'], instance.counters['system.process.load_average_1m'].count);
				});

				it('has a `system.process.next_tick.mean` property set to the histogram mean value', () => {
					assert.strictEqual(returnValue['system.process.next_tick.mean'], metrics.mockHistogram.mean.firstCall.returnValue);
				});

				it('has a `system.process.next_tick.stdDev` property set to the histogram stdDev value', () => {
					assert.strictEqual(returnValue['system.process.next_tick.stdDev'], metrics.mockHistogram.stdDev.firstCall.returnValue);
				});

				it('has a `system.process.next_tick.min` property set to the histogram min value', () => {
					assert.strictEqual(returnValue['system.process.next_tick.min'], metrics.mockHistogram.min);
				});

				it('has a `system.process.next_tick.max` property set to the histogram max value', () => {
					assert.strictEqual(returnValue['system.process.next_tick.max'], metrics.mockHistogram.max);
				});

				it('has a `system.process.next_tick.sum` property set to the histogram sum value', () => {
					assert.strictEqual(returnValue['system.process.next_tick.sum'], metrics.mockHistogram.sum);
				});

				it('has a `system.process.next_tick.median` property set to the histogram 50th percentile', () => {
					assert.strictEqual(returnValue['system.process.next_tick.median'], mockPercentiles[0.5]);
				});

				it('has a `system.process.next_tick.95th` property set to the histogram 95th percentile', () => {
					assert.strictEqual(returnValue['system.process.next_tick.95th'], mockPercentiles[0.95]);
				});

				it('has a `system.process.next_tick.99th` property set to the histogram 99th percentile', () => {
					assert.strictEqual(returnValue['system.process.next_tick.99th'], mockPercentiles[0.99]);
				});

			});

		});

		it('has an `instrument` method', () => {
			assert.isFunction(instance.instrument);
		});

		describe('.instrument()', () => {
			let mockMemoryUsage;

			beforeEach(() => {
				mockMemoryUsage = {
					rss: 123,
					heapTotal: 456,
					heapUsed: 789
				};
				sinon.stub(global, 'setInterval').returns({
					unref: sinon.stub()
				});
				sinon.stub(process, 'hrtime').returns([0, 0]);
				sinon.stub(process, 'memoryUsage').returns(mockMemoryUsage);
				sinon.stub(process, 'nextTick');
				instance.instrument();
			});

			afterEach(() => {
				global.setInterval.restore();
				process.hrtime.restore();
				process.memoryUsage.restore();
				process.nextTick.restore();
			});

			it('sets two intervals', () => {
				assert.calledTwice(global.setInterval);
			});

			describe('memory/CPU interval', () => {
				let setIntervalCall;

				beforeEach(() => {
					instance.counters['system.process.mem_process_rss'].count = 0;
					instance.counters['system.process.mem_process_heapTotal'].count = 0;
					instance.counters['system.process.mem_process_heapUsed'].count = 0;
					instance.counters['system.process.load_average_1m'].count = 0;
					setIntervalCall = global.setInterval.firstCall;
					setIntervalCall.args[0]();
				});

				it('should be set to inverval every 5000ms', () => {
					assert.strictEqual(setIntervalCall.args[1], 5000);
				});

				it('should get the process memory usage', () => {
					assert.calledOnce(process.memoryUsage);
				});

				it('should get the OS load average', () => {
					assert.calledOnce(os.loadavg);
				});

				it('should set the instance counters to the expected values', () => {
					assert.strictEqual(instance.counters['system.process.mem_process_rss'].count, mockMemoryUsage.rss);
					assert.strictEqual(instance.counters['system.process.mem_process_heapTotal'].count, mockMemoryUsage.heapTotal);
					assert.strictEqual(instance.counters['system.process.mem_process_heapUsed'].count, mockMemoryUsage.heapUsed);
					assert.strictEqual(instance.counters['system.process.load_average_1m'].count, os.mockLoadavg[0]);
				});

			});

			describe('process.nextTick interval', () => {
				let setIntervalCall;

				beforeEach(() => {
					process.hrtime.onCall(0).returns([10, 5]);
					process.hrtime.onCall(1).returns([1, 45]);
					setIntervalCall = global.setInterval.secondCall;
					setIntervalCall.args[0]();
				});

				it('should be set to inverval every 1000ms', () => {
					assert.strictEqual(setIntervalCall.args[1], 1000);
				});

				it('should get a high-resolulution start time', () => {
					assert.calledOnce(process.hrtime);
				});

				it('should call `process.nextTick`', () => {
					assert.calledOnce(process.nextTick);
				});

				describe('nextTick function', () => {
					let nextTickCall;

					beforeEach(() => {
						nextTickCall = process.nextTick.firstCall;
						nextTickCall.args[0]();
					});

					it('should get a high-resolulution end time based on the start time', () => {
						assert.calledTwice(process.hrtime);
						assert.calledWith(process.hrtime, [10, 5]);
					});

					it('updates the histogram with the diff of the two high-resolution times', () => {
						assert.calledOnce(instance.counters['system.process.next_tick'].update);
						assert.calledWith(instance.counters['system.process.next_tick'].update, 1000000045);
					});

				});

			});

		});

	});

});
