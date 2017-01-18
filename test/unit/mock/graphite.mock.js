'use strict';

const sinon = require('sinon');

const Graphite = module.exports = sinon.stub();

Graphite.mockInstance = {
	log: sinon.stub()
};

Graphite.returns(Graphite.mockInstance);
