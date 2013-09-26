var Class = require("../core/class");
var Object = require("../core/object");

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var util = require("util");

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var SampleHandler = Class.Inherit("SampleHandler", Object, function (name, core, journal, settings) {
	
	Class.Construct(this, name);

	this.core = core;
	this.journal = journal;
	this.settings = settings;

	this.groups = {
		"io": {
			"ch01":0
		}
	};

	return this;
});

SampleHandler.prototype.initialize = function (done) {

	done();
};

SampleHandler.prototype.release = function () {

};

SampleHandler.prototype.process = function () {

	var that = this;

	that.core.cpub("io", "ch01", 0, function (err) {
		if (err) {
			that.journal.error(err.toString());
		} else {
			that.journal.information("Channel is published");
		}
	});

	setInterval(function() {
		that.core.cread("io", "ch01", function (err, value) {
			if (err) {
				that.journal.error(err.toString());
			} else {
				that.journal.information(value.toString());
			}
		});

		//that.journal.information("Process module is active!");
	}, 1000);
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

SampleHandler.prototype.cread = function (data, responce) {

	responce(null, this.groups[data.group][data.channel]++);
};

SampleHandler.prototype.cwrite = function (data, responce) {
	responce(null, 125);
};

SampleHandler.prototype.cpub = function (data) {

};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports = SampleHandler;