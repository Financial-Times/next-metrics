/* global describe, it, beforeEach, afterEach */
'use strict';
var request = require('superagent'),
    mocha = require('mocha'),
    fs = require('fs'),
    nock = require('nock'),
    expect = require('chai').expect,
    app = require('../proxy');
    var mockProfiles = require('./mockProfileData.js').getProfiles();

describe('Router', function() {
  
    var host = 'http://localhost:5000',
        server;

    before(function (done) {
      var mock = nock('http://next-service-registry.herokuapp.com').get('/services').reply(200, mockProfiles, {'Content-Type': 'application/json'});
      // FIXME figure out a better way to wait for the app to be ready than introducing a delay 
      setTimeout(function () {
          done();
        }, 1000);
    });

    beforeEach(function () {
        server = app.listen(5000);
    });
    
    afterEach(function () {
        server.close();
    });

    describe('Service', function () {

        it('Respond with a success when requesting a valid service path', function (done) {
            var mock = nock('http://next-router-test-app-badger-1.herokuapp.com').get('/badger').reply(200, '');
            request.get(host + '/badger').end(function (err, res) {
                    expect(res.status).to.equal(200);
                    expect(mock.isDone()).to.be.true;
                    done();
            });
        });
        
        it('Respond with a not found message when requesting an invalid service path', function (done) {
            var mock = nock('http://next-router-test-app-badger-1.herokuapp.com').get('/four-oh-four').reply(404, '');
            request.get(host + '/four-oh-four').end(function (err, res) {
                    expect(res.status).to.equal(404);
                    done();
            });
        });
        
        it('Vary by service version', function (done) {
            var mock = nock('http://next-router-test-app-badger-1.herokuapp.com').get('/badger').reply(200, '');
            request.get(host + '/badger').end(function (err, res) {
                    expect(res.headers.vary).to.contain('X-Version');
                    done();
            });
        });

    });

    describe('Filter', function () {
    
        it('by version number', function (done) {
            var mock = nock('http://next-router-test-app-bodger-1.herokuapp.com').get('/badger').reply(200, '');
            request.get(host + '/badger')
                   .set('x-version', '#234')
                   .end(function (err, res) {
                      expect(res.header['x-version']).to.equal('#234');
                      expect(res.status).to.equal(200);
                      done();
            });
        });
        
        it('by user-agent', function (done) {
            var mock = nock('http://next-router-test-app-bodger-1.herokuapp.com').get('/badger').reply(200, '');
            request.get(host + '/badger')
                   .set('user-agent', 'Google Nexus 4.2')
                   .end(function (err, res) {
                      expect(res.header['x-version']).to.equal('#234');
                      expect(res.status).to.equal(200);
                      done();
            });
        });
        
        it('by x-headers', function (done) {
            var mock = nock('http://next-router-test-app-bodger-1.herokuapp.com').get('/badger').reply(200, '');
            request.get(host + '/badger')
                   .set('x-foo', 'hello')
                   .end(function (err, res) {
                      expect(res.header['x-version']).to.equal('#234');
                      expect(res.status).to.equal(200);
                      done();
            });
        });
        
        it('Respond with a not found message when a specified filter does not exist', function (done) {
            var mock = nock('http://next-router-test-app-badger-1.herokuapp.com').get('/badger').reply(404, '');
            request.get(host + '/badger')
                   .set('x-version', '999')
                   .end(function (err, res) {
                      expect(res.status).to.equal(404);
                      done();
            });
        });
      
    });
});
