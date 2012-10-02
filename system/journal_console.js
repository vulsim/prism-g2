var Class = require("../core/class");
var Object = require("../core/object");

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var journal = require("../core/journal").journal;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var ConsoleLog = Class.Inherit("ConsoleLog", Object, function (name) {
	
	Class.Construct(this, name);
	
	return this;
});

ConsoleLog.prototype.configure = function (settings) {

	console.log(settings);
};

ConsoleLog.prototype.information = function(message) {
	
	console.log("INFO\t" + message);
};

ConsoleLog.prototype.warning = function(message) {

	console.log("WARN\t" + message);
};

ConsoleLog.prototype.error = function(message) {

	console.log("ERROR\t" + message);
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports = ConsoleLog;