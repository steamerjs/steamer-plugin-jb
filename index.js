"use strict";

const pluginutils = require('steamer-pluginutils'),
	  path = require('path'),
	  fs = require('fs'),
	  inquirer = require('inquirer');

function JBPlugin(argv) {
	this.argv = argv;
	this.utils = new pluginutils("steamer-plugin-example");
}

JBPlugin.prototype.init = function() {
	this.askType();
};

/**
 * ask build type
 */
JBPlugin.prototype.askType = function() {
	inquirer.prompt([{
		type: 'list',
		name: 'type',
		choices: [
			'offline',
			'online',
		],
		message: "please select a jb compilation type",
	}]).then((answers) => {
	    let type = answers.type || 'offline';
	    
	    if (type) {
	    	try {
	    		this.pkgJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), "package.json"), "utf-8"));
	    	}
	    	catch(e) {
	    		this.pkgJson = {};
	    	}
	    	this.buildConfig(type);
	    }
	});
};

/**
 * build config
 * @param  {String} type [build type]
 */
JBPlugin.prototype.buildConfig = function(type) {
	if (type === 'offline') {
		this.buildOffline();
	}
	else if (type === 'online') {
		this.buildOnline();
	}
};

/**
 * build config for offline type
 */
JBPlugin.prototype.buildOffline = function() {
	let configJson = require('./template/config.json');

	fs.writeFileSync(path.join(process.cwd(), 'config.json'), JSON.stringify(configJson, null, 4), "utf-8");
};

/**
 * build config for online type
 */
JBPlugin.prototype.buildOnline = function() {

	let projectJs = require('./template/project.js');
	projectJs.name = this.pkgJson.name || projectJs.name;

	inquirer.prompt([{
		type: 'input',
		name: 'bid',
		message: "please input offline bid",
	}]).then((answers) => {
	    let bid = answers.bid || "";
	    
    	projectJs.offline.bid = bid;
    	fs.writeFileSync(path.join(process.cwd(), 'project.js'), "module.exports = " + JSON.stringify(projectJs, null, 4), "utf-8");
	});
	
};

/**
 * [help]
 */
JBPlugin.prototype.help = function() {
	this.utils.printUsage('jb config creator', 'jb');
};

module.exports = JBPlugin;