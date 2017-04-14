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
	// console.log(this.argv);

	this.askType();
};

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

JBPlugin.prototype.buildConfig = function(type) {
	if (type === 'offline') {
		this.buildOffline();
	}
	else if (type === 'online') {
		this.buildOnline();
	}
};

JBPlugin.prototype.buildOffline = function(type) {
	let configJson = require('./template/config.json');

	fs.writeFileSync(path.join(process.cwd(), 'config.json'), JSON.stringify(configJson, null, 4), "utf-8");
};

JBPlugin.prototype.buildOnline = function(type) {

	let projectJs = require('./template/project.js');
	projectJs.name = this.pkgJson.name || projectJs.name;

	inquirer.prompt([{
		type: 'input',
		name: 'bid',
		message: "please input offline bid",
	}]).then((answers) => {
	    let bid = answers.bid || null;
	    
	    if (bid) {
	    	projectJs.offline.bid = bid;
	    	fs.writeFileSync(path.join(process.cwd(), 'project.js'), JSON.stringify(projectJs, null, 4), "utf-8");
	    }
	});
	
};

JBPlugin.prototype.help = function() {
	this.utils.printUsage('steamer plugin example', 'example');
	this.utils.printOption([
		{
			option: "list",
			alias: "l",
			description: "list examples"
		},
	]);
};

module.exports = JBPlugin;