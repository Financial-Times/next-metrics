'use strict';

var routeProfiles = [{
	name: "mostpopular",
	path: "mostpopular", // A regex to match the high level traffic (possibly use a service to resolve a page to a type of thing and route accordingly.)
	desc: "A service that creates perfectly formed badgers",
	versions: {
		"#123": {
			nodes: [
				"mostpopular.sp.ft-static.com"
			],
			isPrimary: true  // Indicates which service is the default to receive traffic
		},
		"#234": {
			nodes: [
				"ft-popular-content-test.herokuapp.com"
			],
			filters: {
				//"load": 5%, // take this percentage of...
				"http.userAgent": [ "Googlebot" ], // this regex pattern to match against the  user agent
				"rateLimitTo": 10, //  request p/sec
				"http.cookieValue": "thing", // a regex to test against the cookie value
				"geo.country": "uk",
				"deny": "all",
				"access": "129.412.12.32"
			}
		}
	}
},
{
	name: "newsfeed",
	path: "newsfeed", // A regex to match the high level traffic (possibly use a service to resolve a page to a type of thing and route accordingly.)
	desc: "A service that creates perfectly formed badgers",
	versions: {
		"#123": {
			nodes: [
				"newsfeed.ft.com"
			],
			isPrimary: true  // Indicates which service is the default to receive traffic
		}
	}
}

];

function getProfiles () {
	return routeProfiles;
}

module.exports.getProfiles = getProfiles;