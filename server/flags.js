
var flags = {}
  , poller
  , interval = 3000;


var Flag = function (opts) {
    var opts = opts || {};
    this.id = opts.id;
    this.state = opts.state || false;
}

Flag.prototype.isSwitchedOn = function () {
    return this.state;
}

module.exports = {
   
    get: function () {
        return flags;
    },

    hydrate: function () {
        poller = setInterval(function () {
            console.log('fetching flags')
            flags = {
                foo: new Flag({ id: 'foo', state: true }), 
                boo: new Flag({ id: 'boo' }), 
            };
        }, interval)
    }

}
