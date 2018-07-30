'use strict';

const sinon = require('sinon');

module.exports = {
	default: {
		data: sinon.stub(),
		debug: sinon.stub(),
		error: sinon.stub(),
		info: sinon.stub(),
		silly: sinon.stub(),
		verbose: sinon.stub(),
		warn: sinon.stub(),
	}
};
