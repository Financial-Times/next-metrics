'use strict';

const sinon = require('sinon');

module.exports = {
	debug: sinon.stub(),
	error: sinon.stub(),
	info: sinon.stub(),
	warn: sinon.stub(),
};
