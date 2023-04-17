const chai = require('chai');
const sinonChai = require('sinon-chai');
const nodeFetch = require('node-fetch');
const Fetch = require('../../lib/metrics/fetch');

chai.use(sinonChai);
const should = chai.should();

const instrumentNodeFetch = () => {
	const instance = new Fetch(
		{
			fetchInstance: nodeFetch,
			services: {
				ftdotcom: /^https?:\/\/www\.ft\.com/
			}
		});
	fetch = instance.instrument();
	return instance;
};

const instrumentNativeFetch = () => {
	// we're not passing in fetchInstance in this case as global fetch will be used.
	// In reality this is how existing implementations will work with node-fetch as well
	// as CP fetch calls are made via isomorphic-fetch (https://github.com/matthew-andrews/isomorphic-fetch)
	// in n-fetch which replaces the global instance of fetch with node-fetch if no global fetch is present
	const instance = new Fetch(
		{
			services: {
				ftdotcom: /^https?:\/\/www\.ft\.com/
			}
		});
	instance.instrument();
	return instance;
};

// todo use more real world CP examples
const runTheTests = async (instrumentFetch) => {
	let fetchMetrics;

	beforeEach(() => {
		// add intrumentation to fetch instances
		fetchMetrics = instrumentFetch(fetchMetrics);
	});

	afterEach(() => {
		//remove instrumentation
		fetch.restore();
	});

	it('should be able to fetch', async () => {
		const response = await fetch('https://www.ft.com', {
			method: 'GET'
		});

		return response.status.should.eql(200);
	});

	it('should generate report with relevant metrics', async () => {
		await fetch('https://www.ft.com');

		// need to do this a bit later, as the metrics are added out of the microqueue
		setTimeout(() => {
			const report = fetchMetrics.reporter();

			report.should.contain({
				'fetch.ftdotcom.count': 1,
				'fetch.ftdotcom.response.status_200.count': 1,
				'fetch.ftdotcom.response.status_2xx.count': 1
			});
			['200', '2xx'].forEach(status => {
				['mean', 'min', 'max', 'median', '95th', '99th'].forEach(grouping => {
					const key = `fetch.ftdotcom.response.status_${status}.response_time.${grouping}`;
					should.exist(report[key], `${key} doesn’t exist`);
				});
			});
		}, 10);
	});
};

describe('Make fetch happen', () => {
	context('Native Fetch', async () => {
		await runTheTests(instrumentNativeFetch);
	});

	context('Node Fetch', async () => {
		await runTheTests(instrumentNodeFetch);
	});
});
