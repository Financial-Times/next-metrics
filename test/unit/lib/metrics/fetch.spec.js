const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

const Fetch = require('../../../../lib/metrics/fetch');

chai.use(sinonChai);
const should = chai.should();
const expect = chai.expect;

describe('Fetch', () => {

	let fetchStub;

	beforeEach(() => {
		fetchStub = sinon.stub()
			.resolves({
				status: 200
			});

		global.fetch = fetchStub;
	});

	afterEach(() => {
		global.fetch = undefined;
	});

	it('should be able to instrument', () => {
		const fetch = new Fetch();
		fetch.instrument();
		global.fetch._instrumented.should.be.true;
		global.fetch.should.not.equal(fetchStub);
	});

	it('should throw error if instrumenting when there’s no `global.fetch`', () => {
		global.fetch = undefined;
		const fetch = new Fetch();
		try{
			fetch.instrument();
		}
		catch(error){
			expect(error.message).to.equal('next-metrics: You need to `require(\'isomorphic-fetch\');` or pass a fetchInstance as an option before instrumenting it');
		}
	});

	it('should be able to restore', () => {
		const fetch = new Fetch();
		fetch.instrument();
		global.fetch.restore();

		global.fetch.should.equal(fetchStub);
	});

	it('should be able to fetch', () => {
		const fetch = new Fetch({
			services: {
				blogs: /^https?:\/\/blogs\.ft\.com/
			}
		});
		fetch.instrument();

		return global.fetch('https://blogs.ft.com', {
			method: 'PUT'
		})
			.then(res => {
				res.should.eql({
					status: 200
				});
				fetchStub.should.always.have.been.calledWithExactly('https://blogs.ft.com', {
					method: 'PUT'
				});
			});
	});

	it('should call `onUninstrumented` and actual fetch if unknown service', () => {
		const onUninstrumentedSpy = sinon.spy(() => {});
		const fetch = new Fetch({
			services: {
				blogs: /^https?:\/\/blogs\.ft\.com/
			}
		});
		fetch.instrument({
			onUninstrumented: onUninstrumentedSpy
		});

		return global.fetch('https://www.ft.com', {
			method: 'PUT'
		})
			.then(() => {
				onUninstrumentedSpy.should.always.have.been.calledWithExactly('https://www.ft.com', {
					method: 'PUT'
				});
				fetchStub.should.always.have.been.calledWithExactly('https://www.ft.com', {
					method: 'PUT'
				});
			});
	});

	it('should be able to get report', done => {
		const fetch = new Fetch({
			services: {
				blogs: /^https?:\/\/blogs\.ft\.com/
			}
		});
		fetch.instrument();
		global.fetch('https://blogs.ft.com');

		// need to do this a bit later, as the metrics are added out of the microqueue
		setTimeout(() => {
			const report = fetch.reporter();

			report.should.contain({
				'fetch.blogs.count': 1,
				'fetch.blogs.response.status_200.count': 1,
				'fetch.blogs.response.status_2xx.count': 1
			});
			['200', '2xx'].forEach(status => {
				['mean', 'min', 'max', 'median', '95th', '99th'].forEach(grouping => {
					const key = `fetch.blogs.response.status_${status}.response_time.${grouping}`;
					should.exist(report[key], `${key} doesn’t exist`);
				});
			});
			done();
		}, 10);
	});

	it('should count multiple requests', done => {
		const fetch = new Fetch({
			services: {
				blogs: /^https?:\/\/blogs\.ft\.com/
			}
		});
		fetch.instrument();
		global.fetch('https://blogs.ft.com');
		global.fetch('https://blogs.ft.com');

		// need to do this a bit later, as the metrics are added out of the microqueue
		setTimeout(() => {
			fetch.reporter().should.contain({
				'fetch.blogs.count': 2,
				'fetch.blogs.response.status_200.count': 2,
				'fetch.blogs.response.status_2xx.count': 2
			});
			done();
		}, 10);
	});

	it('should handle multiple non-2xx responses', done => {
		fetchStub.resolves({
			status: 404
		});
		const fetch = new Fetch({
			services: {
				blogs: /^https?:\/\/blogs\.ft\.com/
			}
		});
		fetch.instrument();
		fetchStub.resolves({
			status: 404
		});
		global.fetch('https://blogs.ft.com');
		fetchStub.resolves({
			status: 500
		});
		global.fetch('https://blogs.ft.com');

		// need to do this a bit later, as the metrics are added out of the microqueue
		setTimeout(() => {
			fetch.reporter().should.contain({
				'fetch.blogs.count': 2,
				'fetch.blogs.response.status_404.count': 1,
				'fetch.blogs.response.status_4xx.count': 1,
				'fetch.blogs.response.status_500.count': 1,
				'fetch.blogs.response.status_5xx.count': 1
			});
			done();
		}, 10);
	});

	it('should clear metrics after reporting', done => {
		fetchStub.resolves({
			status: 404
		});
		const fetch = new Fetch({
			services: {
				blogs: /^https?:\/\/blogs\.ft\.com/
			}
		});
		fetch.instrument();
		global.fetch('https://blogs.ft.com');

		// need to do this a bit later, as the metrics are added out of the microqueue
		setTimeout(() => {
			fetch.reporter();
			fetchStub.resolves({
				status: 500
			});
			global.fetch('https://blogs.ft.com');

			setTimeout(() => {
				fetch.reporter().should.contain({
					'fetch.blogs.count': 1,
					'fetch.blogs.response.status_500.count': 1,
					'fetch.blogs.response.status_5xx.count': 1
				});
				done();
			}, 10);
		}, 10);
	});

	it('should be able to use fetchInstance and assign to global.fetch', () => {
		const fetchInstanceStub = sinon.stub()
			.resolves({
				status: 200
			});

		global.fetch.should.equal(fetchStub);

		const fetch = new Fetch({fetchInstance : fetchInstanceStub});
		const fetchInstrumentedInstance = fetch.instrument();
		fetchInstrumentedInstance.should.equal(global.fetch);
		expect(global.fetch._fromFetchInstance).to.equal(true);
		fetchInstrumentedInstance._instrumented.should.be.true;

	});
	it('should be able to use fetchInstance without assign to global.fetch', () => {
		const fetchInstanceStub = sinon.stub()
			.resolves({
				status: 200
			});

		global.fetch = null;

		const fetch = new Fetch({fetchInstance : fetchInstanceStub , overrideGlobalFetch : false});
		const fetchInstrumentedInstance = fetch.instrument();
		fetchInstrumentedInstance.should.not.equal(global.fetch);
		expect(fetchInstrumentedInstance._fromFetchInstance).to.equal(true);
		fetchInstrumentedInstance._instrumented.should.be.true;
	});
});
