'use strict';

const path = require('path'),
    fs = require('fs-extra'),
    expect = require('expect.js'),
    sinon = require('sinon'),
    bluebird = require('bluebird'),
    Plugin = require('../index');

const PROJECT = path.join(process.cwd(), 'test/project/'),
    JBCONFIG = path.join(PROJECT, 'steamer-example/.steamer/steamer-plugin-jb.js');

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

function clearCache(projectPath) {
    if (typeof require.cache[projectPath] !== 'undefined') {
        delete require.cache[projectPath];
    }
}


describe('online & offline', function() {

    before(function() {
        process.chdir(path.join(PROJECT, 'steamer-example'));
    });

    after(function() {
        process.chdir('../../../');
    });

    it('offline', function(done) {

        this.timeout(10000);

        let jb = new Plugin({});

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

        let jb = new Plugin({});

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

        let jb = new Plugin({});

        jb.help();

    });

});

describe('init', function() {

    before(function() {
        process.chdir(path.join(PROJECT, 'steamer-example'));
        fs.removeSync(JBCONFIG);
    });

    after(function() {
        process.chdir('../../../');
    });


    it('init', function() {
        let jb = new Plugin({
            init: true
        });
        jb.init();
        
        let config = require(JBCONFIG);
        expect(config).to.eql({ plugin: 'steamer-plugin-jb', config: {} });
    });
});

describe('add deploy id', function(cb) {

    before(function() {
        process.chdir(path.join(PROJECT, 'steamer-example'));
    });

    after(function() {
        process.chdir('../../../');
    });


    it('init -a id', function(cb) {
        fs.removeSync(JBCONFIG);

        let jb = new Plugin({
            add: 'R1234'
        });

        let gitStub = sinon.stub(jb.git, 'branchLocal').callsArgWith(0, null, { current: 'master' }),
            infoStub = sinon.stub(jb, 'info');


        jb.addDeployId('R1234').then((result) => {
            clearCache(JBCONFIG);
            let config = require(JBCONFIG);
            expect(config).to.eql({ plugin: 'steamer-plugin-jb', config: { git: { master: 'R1234' }}});
            expect(infoStub.calledWith('succeeed to add jb deployment id: R1234 to branch: master.'));

            gitStub.restore();
            infoStub.restore();
            cb();
        }).catch((e) => {
            console.log(e);
            gitStub.restore();
            cb();
        });
    });

    it('init -a branch=id', function(cb) {
        fs.removeSync(JBCONFIG);

        let jb = new Plugin({
            add: 'abc=R12345'
        });

        let infoStub = sinon.stub(jb, 'info');


        jb.addDeployId('abc=R12345').then((result) => {
            let config = require(JBCONFIG);
            expect(config).to.eql({ plugin: 'steamer-plugin-jb', config: { git: { abc: 'R12345' }}});
            expect(infoStub.calledWith('succeeed to add jb deployment id: R12345 to branch: abc.'));

            infoStub.restore();
            cb();
        }).catch((e) => {
            cb();
        });
    });

    it('init error', function(cb) {

        let jb = new Plugin({
            add: 'abc=R12345'
        });

        jb.addDeployId(true).then((result) => {
            cb();
        }).catch((e) => {
            expect(e.message).to.eql('Please follow this format: steamer jb -a branch=id or steamer jb -a id');
            cb();
        });
    });
});

describe('start deploying', function(cb) {

    before(function() {
        let jb = new Plugin({
            add: 'master=R12345'
        });

        process.chdir(path.join(PROJECT, 'steamer-example'));

        jb.addDeployId('abc=R12345').then((result) => {
            // console.log(result);
        });
        jb.addDeployId('cde=R123456').then((result) => {
            // console.log(result);
        });
    });

    it('deploy current branch', function(cb) {
        let jb = new Plugin({});

        let deployRequestStub = sinon.stub(jb, 'deployRequest').usingPromise(bluebird.Promise).resolves('success'),
            gitStub = sinon.stub(jb.git, 'branchLocal').callsArgWith(0, null, { current: 'abc' }),
            infoStub = sinon.stub(jb, 'info');

        jb.deployProject(true).then((result) => {
            expect(result).to.eql('success');
            expect(infoStub.calledWith('Deploying...\nIt may take a few minutes.'));
            expect(deployRequestStub.calledWith({
                did: 'R12345',
                opUser: 'steamer',
                token: 'ASdxseRTSXfiGUIxnuRisTU'
            })).to.eql(true);

            deployRequestStub.restore();
            gitStub.restore();
            infoStub.restore();
            cb();
        }).catch((e) => {
            cb();
        });
    });

    it('deploy specific branch', function(cb) {
        let jb = new Plugin({});
        let deployRequestStub = sinon.stub(jb, 'deployRequest').usingPromise(bluebird.Promise).resolves('success'),
            infoStub = sinon.stub(jb, 'info');

        jb.deployProject('cde').then((result) => {
            expect(result).to.eql('success');
            expect(infoStub.calledWith('Deploying...\nIt may take a few minutes.'));
            expect(deployRequestStub.calledWith({
                did: 'R123456',
                opUser: 'steamer',
                token: 'ASdxseRTSXfiGUIxnuRisTU'
            })).to.eql(true);

            deployRequestStub.restore();
            infoStub.restore();
            cb();
        }).catch((e) => {
            cb();
        });
    });

    it('deploy request success', function(cb) {
        let jb = new Plugin({});
        let deployConfig = {
            did: 'R123456',
            opUser: 'steamer',
            token: 'ASdxseRTSXfiGUIxnuRisTU'
        };

        let requestStub = sinon.stub(jb.request, 'post').yields(null, null, JSON.stringify({ code: 0 })),
            infoStub = sinon.stub(jb, 'sucess');

        jb.deployRequest(deployConfig).then((result) => {
            expect(infoStub.calledWith('Deploying success!'));
            expect(result).to.eql('success');
            requestStub.restore();
            cb();
        }).catch((e) => {
            console.log(e);
            cb();
        });
    });

    it('deploy request failure', function(cb) {
        let jb = new Plugin({});
        let deployConfig = {
            did: 'R123456',
            opUser: 'steamer',
            token: 'ASdxseRTSXfiGUIxnuRisTU'
        };

        let requestStub = sinon.stub(jb.request, 'post').yields(null, null, JSON.stringify({ code: 1 }));

        jb.deployRequest(deployConfig).then((result) => {
            cb();
        }).catch((e) => {
            expect(e.message).to.eql('Deployment failure!');
            requestStub.restore();
            cb();
        });
    });
});