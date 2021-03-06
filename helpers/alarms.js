var Class = require("../core/class");
var Object = require("../core/object");

var CCore = require("../helpers/ccore").CCore;
var CJournal = require("../helpers/cjournal").CJournal;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var util = require("util");

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var Alarms = Class.Inherit("Alarms", Object, function (name, context, messages) {
	
	Class.Construct(this, name);

	this.core = new CCore("CCoreHelper", context);
	this.journal = new CJournal("CJournalHelper", context);
	this.messages = messages;

	return this;
});

Alarms.prototype.set = function (alarm, message, cb) {

	var that = this;

	try {
		var value = "[U]";
				
		if (message) {
			value = message;
		} else if (that.messages && that.messages[alarm]) {
			value = that.messages[alarm];
		}

		that.core.cwrite("alarm", alarm + "-manual", value, function (err, group, channel, value) {
			try {
				if (err) {
					cb(new Error("Can't set alarm"));
				} else {
					cb();
				}
			} catch (e) {
				that.journal.error(e.stack.toString());
				cb(e);
			}
		});
	} catch (e) {
		that.journal.error(e.stack.toString());
		cb(e);
	}
};

Alarms.prototype.reset = function (alarm, cb) {

	var that = this;

	try {

		that.core.cwrite("alarm", alarm + "-manual", "", function (err, group, channel, value) {
			try {
				if (err) {
					cb(new Error("Can't reset alarm"));
				} else {
					cb();
				}
			} catch (e) {
				that.journal.error(e.stack.toString());
				cb(e);
			}
		});
	} catch (e) {
		that.journal.error(e.toString());
		cb(e);
	}
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports.Alarms = Alarms;
