var Class = require("../core/class");
var Object = require("../core/object");

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var util = require("util");

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var Handler = Class.Inherit("CommonAlarms", Object, function (name, core, journal, settings) {
	
	Class.Construct(this, name);

	this.core = core;
	this.journal = journal;
	this.settings = settings;

	return this;
});

Handler.prototype.initialize = function (done) {

	done();
};

Handler.prototype.release = function () {

};

Handler.prototype.process = function () {

	var that = this;

};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

Handler.prototype.cread = function (data, responce) {

};

Handler.prototype.cwrite = function (data, responce) {
	
};

Handler.prototype.cpub = function (data) {

};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports = Handler;