'use strict';

const assert = require('chai').assert;
const sanitiseMetrics = require('../../../../lib/graphite/sanitise-metrics');
const mockery = require('mockery');
const sinon = require('sinon');

describe('lib/graphite/sanitise-metrics', () => {
    let nLogger;
    let clock;
    beforeEach(() => {
        // hardcoding the date to Epoch timestamp: 1434399121 for testing metrics inputs
        clock = sinon.useFakeTimers(new Date('Mon, 15 Jun 2015 20:12:01 UTC').getTime());
        nLogger = require('../../mock/n-logger.mock');
        mockery.registerMock('@financial-times/n-logger', nLogger);
    });
    afterEach(() => {
        clock.restore();
    });
    const metrics = { 'metric1': 123, 'metric2': 23 };
    const metrics_prefix = 'UUID.appname.';
    it('coverts metrics into an array', () => {
        const data = sanitiseMetrics({
            metrics_prefix,
            metrics
        });
        assert.isArray(data);
    });
    it('coverts metrics into an arrray with right properties', () => {
        const data = sanitiseMetrics({
            metrics_prefix,
            metrics
        });
        assert.equal(data[0], 'UUID.appname.metric1 123 1434399121');
        assert.equal(data[1], 'UUID.appname.metric2 23 1434399121');
    });
    it('strip out metrics with NaN values', () => {
        const metrics = { 'metric1': 123, 'metric2': NaN };
        const data = sanitiseMetrics({
            metrics_prefix,
            metrics
        });
        assert.equal(data.length, 1)
    });
    it('replace a space in metric names with underscore', () => {
        const metrics = { 'metric 1': 123 };
        const data = sanitiseMetrics({
            metrics_prefix,
            metrics
        });
        assert.equal(data[0], 'UUID.appname.metric_1 123 1434399121')
    });
    it('replace multiple spaces in metric names with underscores', () => {
        const metrics = { 'metric name.this is 1': 123 };
        const data = sanitiseMetrics({
            metrics_prefix,
            metrics
        });
        assert.equal(data[0], 'UUID.appname.metric_name.this_is_1 123 1434399121')
    });
    it('replace metrics values that are not integers or decimals with 0', () => {
        const metrics = { 'metric1': 'peer' };
        const data = sanitiseMetrics({
            metrics_prefix,
            metrics
        });
        assert.equal(data[0], 'UUID.appname.metric1 0 1434399121')
    });
    it('a warn message with the event APP_IS_SENDING_BAD_METRICS should be logged when metrics name contains spaces', () => {
        const metrics = { 'metric 1': 123 };
        sanitiseMetrics({
            metrics_prefix,
            metrics
        });
        setTimeout(() => {
            assert.calledOnce(nLogger.default.warn);
            assert.isObject(nLogger.default.warn.firstCall.args[0]);
            assert.equal(nLogger.default.warn.firstCall.args[0].event, 'APP_IS_SENDING_BAD_METRICS');
        }, 0);
    });
    it('replace metrics name longer than 255 characters with keylengtherror.{last 5 characters of the long metrics name}', () => {
        const metrics = { 'long.count.hellojshdsjdhjskcns.sdcdscdscds.vdscsdcscf.afefaewfawef.adcfadscfaedf.faedfcadfaerwf.faedfaerferrae.ferfersfserfgse.ferfaerferwf.faerfwerfweferrfhserfj.fesrfserf.frefgerferg.tfyjftygg.sdfsdfvc.dwaedcs.hfddvhh': 123 };
        const data = sanitiseMetrics({
            metrics_prefix,
            metrics
        });
        assert.equal(data[0], 'UUID.appname.keylengtherror.ddvhh 123 1434399121')
    });
    it('replace metrics name longer than 255 characters with keylengtherror.{last 5 characters without any dots of the long metrics name}', () => {
        const metrics = { 'long.count.hellojshdsjdhjskcns.sdcdscdscds.vdscsdcscf.afefaewfawef.adcfadscfaedf.faedfcadfaerwf.faedfaerferrae.ferfersfserfgse.ferfaerferwf.faerfwerfweferrfhserfj.fesrfserf.frefgerferg.tfyjftygg.sdfsdfvc.dwaedcs.hfd.dvhh': 123 };
        const data = sanitiseMetrics({
            metrics_prefix,
            metrics
        });
        assert.equal(data[0], 'UUID.appname.keylengtherror.ddvhh 123 1434399121')
    });
});
