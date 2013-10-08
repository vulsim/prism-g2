var Class = require("../core/class");
var Object = require("../core/object");

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var util = require("util");

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var Alarms = Class.Inherit("Alarms", Object, function (name, core, journal, messages) {
	
	Class.Construct(this, name);

	this.core = core;
	this.journal = journal;
	this.messages = messages;

	return this;
});

Alarms.prototype.set = function (alarm, message, cb) {

	var that = this;

	try {
		var value = "unknown";
		
		if (message) {
			value = message;
		} else  if (that.messages && that.messages[alarm]) {
			value = that.messages[alarm];
		}

		that.core.cpub("alarm", alarm, value, function (e) {
			if (e) {
				cb(new Error("Alarm is not set"));
			} else {
				cb();
			}
		});
	} catch (e) {
		that.journal.error(e.toString());
		cb(e);
	}
};

Alarms.prototype.reset = function (alarm, cb) {

	var that = this;

	try {
		that.core.cupub("alarm", alarm, function (e) {
			if (err) {
				cb(new Error("Can't reset alarm"));
			} else {
				cb();
			}
		});
	} catch (e) {
		that.journal.error(e.toString());
		cb(e);
	}
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports.Alarms = Alarms;