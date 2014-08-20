'use strict';

var routeProfiles = [{
        name: "badger",
        path: "bodger", // A regex to match the high level traffic (possibly use a service to resolve a page to a type of thing and route accordingly.)
        desc: "A service that creates perfectly formed badgers",
        versions: {
            "#123": {
                nodes: [
                    "next-router-test-app-badger-1.herokuapp.com"
                ],
                isPrimary: true // Indicates which service is the default to receive traffic
            },
            "#234": {
                nodes: [
                    "next-router-test-app-bodger-1.herokuapp.com"
                ],
                filters: {
                    //"load": 5%, // take this percentage of...
                    "http.User-Agent": "Nexus 4", // this regex pattern to match against the  user agent
                    "rateLimitTo": 10, //  request p/sec
                    "http.Cookie": {
                        "cookieconsent": "seen"
                    }, // a regex to test against the cookie value
                    "http.x-headers": {
                        "x-foo": 'hello',
                        "x-boo": 'world'
                    },
                    "geo.country": "uk",
                    "deny": "all",
                    "access": "129.412.12.32"
                }
            }
        }
    }, {
        name: "newsfeed",
        path: "newsfeed", // A regex to match the high level traffic (possibly use a service to resolve a page to a type of thing and route accordingly.)
        desc: "A service that creates perfectly formed badgers",
        versions: {
            "#123": {
                nodes: [
                    "newsfeed.ft.com"
                ],
                isPrimary: true // Indicates which service is the default to receive traffic
            }
        }
    }

];

function getProfiles() {
    return routeProfiles;
}

module.exports.getProfiles = getProfiles;