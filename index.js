'use strict';

const SteamerPlugin = require('steamer-plugin'),
    path = require('path'),
    fs = require('fs'),
    inquirer = require('inquirer'),
    merge = require('lodash.merge'),
    git = require('simple-git')(process.cwd()),
    request = require('request');

let jbConfig = {
    opUser: 'steamer',
    token: 'ASdxseRTSXfiGUIxnuRisTU'
};

class JBPlugin extends SteamerPlugin {
    constructor(args) {
        super(args);
        this.argv = args;
        this.git = git;
        this.pluginName = 'steamer-plugin-jb';
        this.description = 'commands for AlloyTeam JB system';

        this.request = request;
    }

    init() {
        let argv = this.argv,
            isAdd = argv.add || argv.a,
            isRun = argv.run || argv.r;

        if (argv.init || argv.i) {
            this.createPluginConfig();
        }
        else if (isAdd) {
            this.addDeployId(isAdd).catch((e) => {
                this.error(e.message);
            });
        }
        else if (isRun) {
            this.deployProject(isRun).catch((e) => {
                this.error(e.message);
            });
        }
        else {
            this.askType();
        }
    }

    addDeployId(keyvalue) {
        return new Promise((resolve, reject) => {
            let id = (String(keyvalue)).split('=');
            let config = this.readPluginConfig(),
                gitConfig = config.git || {};

            if (id.length === 1 && id[0] !== 'true') {
                this.git.branchLocal((err, branches) => {
                    if (err) {
                        return reject(err);
                    }

                    gitConfig[branches.current] = id[0];

                    config = merge({}, config, {
                        git: gitConfig
                    });

                    this.createPluginConfig(config, {
                        overwrite: true
                    });

                    this.info(`succeed to add jb deployment id: ${id[0]} to branch: ${branches.current}.`);
                    resolve('success');
                });
            }
            else if (id.length === 2 && id[1].length) {
                gitConfig[id[0]] = id[1];

                config = merge({}, config, {
                    git: gitConfig
                });

                this.createPluginConfig(config, {
                    overwrite: true
                });
                this.info(`succeed to add jb deployment id: ${id[1]} to branch: ${id[0]}.`);
                resolve('success');
            }
            else {
                reject(new Error('Please follow this format: steamer jb -a branch=id or steamer jb -a id'));
            }
        });
    }

    deployProject(branch) {
        return new Promise((resolve, reject) => {
            let config = this.readPluginConfig(),
                gitConfig = config.git || {};

            if (branch === true) {
                this.git.branchLocal((err, branches) => {
                    if (err) {
                        return reject(err);
                    }

                    if (typeof gitConfig[branches.current] !== 'undefined') {

                        let deployConfig = {
                            did: gitConfig[branches.current],
                            opUser: jbConfig.opUser,
                            token: jbConfig.token
                        };

                        this.info('Deploying...\nIt may take a few minutes.');
                        this.deployRequest(deployConfig).then((result) => {
                            resolve(result);
                        }).catch((e) => {
                            reject(e);
                        });
                    }
                    else {
                        this.error('Your branch does not have a JB id.');
                    }

                });
            }
            else {
                if (typeof gitConfig[branch] !== 'undefined') {
                    let deployConfig = {
                        did: gitConfig[branch],
                        opUser: jbConfig.opUser,
                        token: jbConfig.token
                    };
                    this.info('Deploying...\nIt may take a few minutes.');
                    this.deployRequest(deployConfig).then((result) => {
                        resolve(result);
                    }).catch((e) => {
                        reject(e);
                    });
                }
                else {
                    reject(new Error('Your branch does not have a JB id.'));
                }
            }
        });
    }

    deployRequest(config) {
        return new Promise((resolve, reject) => {
            this.request.post('http://jb.oa.com/dist/api/go', {
                form: config
            }, (err, resp, body) => {
                if (err) {
                    return reject(err);
                }

                let data = JSON.parse(body) || {};
                if (!data.code) {
                    this.success('Deployment susccess!');
                    resolve('success');
                }
                else {
                    reject(new Error('Deployment failure!'));
                }
            });
        });
    }

    /**
     * 创建插件配置
     */
    createPluginConfig(config = {}, opt = {}) {
        this.createConfig(config, opt);
    }

    /**
     * 读取插件配置
     */
    readPluginConfig() {
        return this.readConfig();
    }

    /**
     * ask build type
     */
    askType() {
        inquirer.prompt([{
            type: 'list',
            name: 'type',
            choices: [
                'offline',
                'online',
            ],
            message: 'please select a jb compilation type',
        }]).then((answers) => {
            let type = answers.type || 'offline';

            if (type) {
                try {
                    this.pkgJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8'));
                }
                catch (e) {
                    this.pkgJson = {};
                }
                this.buildConfig(type);
            }
        });
    }

    /**
     * build config
     * @param  {String} type [build type]
     */
    buildConfig(type) {
        if (type === 'offline') {
            this.buildOffline();
        }
        else if (type === 'online') {
            this.buildOnline();
        }
    }

    /**
     * build config for offline type
     */
    buildOffline() {
        let configJson = require('./template/config.json');

        fs.writeFileSync(path.join(process.cwd(), 'config.json'), JSON.stringify(configJson, null, 4), 'utf-8');
    }

    /**
     * build config for online type
     */
    buildOnline() {

        let projectJs = require('./template/project.js');
        projectJs.name = this.pkgJson.name || projectJs.name;

        inquirer.prompt([{
            type: 'input',
            name: 'bid',
            message: 'please input offline bid',
        }]).then((answers) => {
            let bid = answers.bid || '';

            projectJs.offline.bid = bid;
            fs.writeFileSync(path.join(process.cwd(), 'project.js'), 'module.exports = ' + JSON.stringify(projectJs, null, 4), 'utf-8');
        });
    }

    /**
     * [help]
     */
    help() {
        this.printUsage('jb config creator', 'jb');
    }
}

module.exports = JBPlugin;