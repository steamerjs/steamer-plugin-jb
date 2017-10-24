'use strict';

const SteamerPlugin = require('steamer-plugin'),
    path = require('path'),
    fs = require('fs'),
    inquirer = require('inquirer');

class JBPlugin extends SteamerPlugin {
    constructor(args) {
        super(args);
        this.argv = args;
        this.pluginName = 'steamer-plugin-jb';
        this.description = 'create config for alloyteam JB system';
    }

    init() {
        this.askType();
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