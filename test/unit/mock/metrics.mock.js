'use strict';

const sinon = require('sinon');

const os = module.exports = {
	Counter: sinon.stub(),
	Histogram: {
		createUniformHistogram: sinon.stub()
	}
};

os.mockCounter = {
	count: 5
};

os.mockHistogram = {
	min: 2,
	max: 3,
	sum: 4,
	mean: sinon.stub(),
	percentiles: sinon.stub(),
	stdDev: sinon.stub(),
	update: sinon.stub()
};

os.Counter.returns(os.mockCounter);
os.Histogram.createUniformHistogram.returns(os.mockHistogram);
