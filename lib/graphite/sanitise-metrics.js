const _ = require('lodash');
const logger = require('@financial-times/n-logger').default;

const sanitiseMetrics = ({ metrics_prefix, metrics }) => { 
	// Remove nulls
	// http://stackoverflow.com/questions/14058193/remove-empty-properties-falsy-values-from-object-with-underscore-js
	let noNulls = _.pickBy(metrics, _.identity);
	let time = new Date() / 1000;
	let metrics_error = false;
	let valid_metrics = _.map(noNulls, (value, key) => {
		// Graphite metric names cant have spaces, replacing spaces with _
		if ((key.indexOf(' ') >= 0 ) || (key.indexOf('\n') >= 0) || (key.indexOf('\t') >= 0)) {
			key = key.replace(/ |\n|\t/g, '_');
			metrics_error = true;
		}
		// Graphite metrics can only be intergers or decimal. Set value for the metrics to zero if value is not a number
		if (typeof value !== 'number') {
			value = 0;
			metrics_error = true;
		}
		// Graphite data can hold metrics of 255 characters. Reserving 55 characters for prefix
		if (key.length > 200) {
			let short_key = key.replace(/\./g, '').slice(-5);
			key = 'keylengtherror.' + short_key;
			metrics_error = true;
		}
		return `${metrics_prefix}${key} ${value} ${time}`;
	});
	if (metrics_error){
		logger.warn({ event: 'APP_IS_SENDING_BAD_METRICS',  message: 'Issues could be Graphite metrics name having spaces or metrics name >255 characters or value not an integer or decimal' });
	}
	return valid_metrics;
}

module.exports = sanitiseMetrics;