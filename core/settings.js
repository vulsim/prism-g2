var Class = require("./class");
var Object = require("./object");

var util = require("util");
var fs = require("fs");
var path = require("path");

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var Settings = Class.Inherit("Settings", Object, function (name) {

	Class.Construct(this, name);

	this.settings = {};
	this.path = { base : path.dirname(process.argv[1]), config : "./prism.conf", core : "./core/", collectors : "./collectors/", use : "./use/" };
			
	return this;
});

Settings.prototype.resolve = function (relativePath, basePath) {

	if (basePath) {
		return path.resolve(basePath, relativePath);
	} else {	
		if (this.path.base) {
			return path.resolve(this.path.base, relativePath);
		}
	}
	
	return "";
};

Settings.prototype.load = function (configPath) {

	if (!configPath) {
		configPath = this.path.config;
	}
		
	var settings = null;

	try {
		settings = JSON.parse(fs.readFileSync(this.resolve(configPath),'utf8'));
	}
	catch (e) {
		console.log(util.format("During loading settings error occurred: %s", e.toString()));	
	}
		
	if (settings) {		

		for (var property in settings) {
			this[property] = settings[property];
		}
    
		this.path.config = this.resolve(configPath);
		this.path.core = this.resolve(this.path.core);
		this.path.collectors = this.resolve(this.path.collectors);
		this.path.use = this.resolve(this.path.use);

		return true;
	}
		
	return false;
};

Settings.prototype.reload = function () {

	var settings = null;
	
	try {			
		settings = JSON.parse(fs.readFileSync(this.path.config,'utf8'));		
	}
	catch (e) {

	}
	
	if (settings) {		
		for (var property in settings) {
			this[property] = settings[property];
		}

		return true;
	}
	
	return false;
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports.Settings = Settings;
module.exports.settings = Settings.default;