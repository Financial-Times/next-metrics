'use strict';

module.exports = function (path) {
	return !/^\/(__sensu|__dependencies|__health|__about|__gtg|__brew-coffee)/.test(path);
};
