var Class = require("../core/class");
var Object = require("../core/object");

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var util = require("util");

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var Handler = Class.Inherit("SampleHandler", Object, function (name, core, journal, settings) {
	
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

	that.core.cpub("io", "test-010", 0, function (err) {
		if (err) {
			that.journal.error(err.toString());
		}
	});

	that.core.cpub("io", "test-011", 0, function (err) {
		if (err) {
			that.journal.error(err.toString());
		}
	});
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

Handler.prototype.cread = function (data, responce) {

	responce(null, 124);
};

Handler.prototype.cwrite = function (data, responce) {
	
	responce(null, 125);
};

Handler.prototype.cpub = function (data) {

};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports = Handler;