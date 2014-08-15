var Service = require('./service');
var _ = require('lodash');

var ServiceCollection = function (profiles) {

    // Covert the json to a model, i.e. var profiles:Array[Service]
    this.profiles = profiles.map(function (profile) {
        return new Service(profile);
    });
    
    // Find first matching service profile for a given URL path
    this.filterByPath = function (path) {
        return _.first(this.profiles.filter(function (profile) {
            return RegExp(profile.path).test(path);		
        }));
    }

}

module.exports = ServiceCollection;
