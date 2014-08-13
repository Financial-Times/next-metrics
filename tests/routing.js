
var request = require('superagent'),
    mocha = require('mocha'),
    fs = require('fs'),
    nock = require('nock'),
    expect = require('chai').expect,
    app = require('../server/app');

describe('Router', function() {
  
    var host = 'http://localhost:5000',
        server;

    beforeEach(function () {
        server = app.listen(5000);
    })
    
    afterEach(function () {
        server.close();
    })

    describe('Service', function () {

        it('Respond with a success when requesting a valid service', function (done) {
            request.get(host + '/badger').end(function (err, res) {
                    expect(res.status).to.equal(200);
                    done();
            })
        })
    });
});
