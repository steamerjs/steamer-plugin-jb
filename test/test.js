'use strict';

const path = require('path'),
    fs = require('fs-extra'),
    expect = require('expect.js'),
    sinon = require('sinon'),
    plugin = require('../index');

const PROJECT = path.join(process.cwd(), 'test/project/');

function userInput(key, val, order, name = '') {

    setTimeout(function () {
        process.stdin.emit(key, val, name);
    }, order * 200);
}

function userInputEnd(cb, order) {
    setTimeout(function () {
        cb();
    }, order * 200);
}


describe('jb', function() {

    before(function() {
        process.chdir(path.join(PROJECT, 'steamer-example'));
    });

    it('offline', function(done) {

        this.timeout(10000);

        let jb = new plugin({});

        jb.init();

        userInput('data', '\n', 1);

        userInputEnd(function() {

            let newConfig = fs.readFileSync(path.join(PROJECT, 'steamer-example/config.json'), 'utf-8');
            let templateConfig = fs.readFileSync(path.join(process.cwd(), '../../../template/config.json'), 'utf-8');

            expect(JSON.parse(newConfig)).to.eql(JSON.parse(templateConfig));
            done();
        }, 2);

    });

    it('online', function(done) {

        this.timeout(10000);

        let jb = new plugin({});

        jb.init();

        userInput('keypress', '', 1, { name: 'down' });
        userInput('data', '\n', 2);
        userInput('data', '2414\n', 3);

        userInputEnd(function() {

            let newConfig = require(path.join(PROJECT, 'steamer-example/project.js'), 'utf-8');
            let templateConfig = require(path.join(process.cwd(), '../../../template/project.js'), 'utf-8');

            templateConfig.name = 'steamer-example';
            templateConfig.offline.bid = '2414';
            expect(newConfig).to.eql(templateConfig);
            done();
        }, 4);

    });

    it('help', function() {

        let jb = new plugin({});

        jb.help();

    });

});