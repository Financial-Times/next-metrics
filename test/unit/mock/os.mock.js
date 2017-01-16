'use strict';

const sinon = require('sinon');

const os = module.exports = {
	cpus: sinon.stub(),
	loadavg: sinon.stub()
};

os.mockCpus = [
	{
		model: 'mock-model-1'
	},
	{
		model: 'mock-model-2'
	}
];

os.mockLoadavg = [
	'mock-1min-avg',
	'mock-5min-avg',
	'mock-15min-avg'
];

os.cpus.returns(os.mockCpus);
os.loadavg.returns(os.mockLoadavg);
