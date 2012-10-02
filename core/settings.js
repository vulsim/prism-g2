var Class = require("./class");
var Object = require("./object");

var fs = require("fs");
var path = require("path");

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var Settings = Class.Inherit("Settings", Object, function (name) {

	Class.Construct(this, name);

	this.settings = {};
	this.path = { base : path.dirname(process.argv[1]), config : "./prism.conf", handlers : "./handlers/" };
			
	return this;
});

Settings.prototype.resolve = function (relativePath) {

	if (this.path.base)
		return path.resolve(this.path.base, relativePath);
	
	return "";
};

Settings.prototype.load = function (configPath) {

	if (!configPath)
		configPath = this.path.config;
		
	var settings = null;
	
	try {
		settings = JSON.parse(fs.readFileSync(this.resolve(configPath),'utf8'));
	}
	catch (e) {

	}
	finally {
			
		if (settings) {			
			this.settings = settings;
			this.path.config = this.resolve(configPath);
			this.path.handlers = this.resolve(this.path.handlers);
			return true;
		}
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
	finally {

		if (settings) {
			this.settings = settings;
			return true;
		}
	}

	return false;
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports.Settings = Settings;
module.exports.settings = Settings.default;