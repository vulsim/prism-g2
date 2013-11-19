var Class = require("../core/class");
var Object = require("../core/object");

var CCore = require("../helpers/ccore").CCore;
var CJournal = require("../helpers/cjournal").CJournal;
var Automation = require("../helpers/automation").Automation;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var util = require("util");


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var Handler = Class.Inherit("Operate", Object, function (name, context, settings) {
		
	Class.Construct(this, name);

	this.context = context;
	this.settings = settings;
	
	this.core = new CCore("CCoreHelper", context);
	this.journal = new CJournal("CJournalHelper", context);
	this.automation = new Automation("AutomationHelper", context);

	return this;
});

Handler.prototype.initialize = function (done) {

	var that = this;

	try {		
		done();
	} catch (e) {
		that.journal.error(e.stack.toString());
		done(e);
	}
};

Handler.prototype.release = function () {

};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

Handler.prototype.operate = function (operate, cb) {

	var that = this;

	try {
		var iterator = function (index, cb) {
			try {
				if (operate[index]) {					
					that.automation.check(operate[index].lock, false, function (result) {
						try {
							if (!result) {
								that.core.cwrite(operate[index].group, operate[index].channel, operate[index].value, function (err, group, channel, value) {
									try {
										if (err) {
											cb(new Error("Operation can not be completed"));
										} else {
											var delayTimerId = setInterval(function() {
												clearInterval(delayTimerId);
												iterator(index + 1, cb);
											}, operate[index].delay);
										}
									} catch (e) {
										that.journal.error(e.stack.toString());
										cb(e);
									}
								});
							} else {
								cb(new Error("Operation can not be completed"));
							}
						} catch (e) {
							that.journal.error(e.stack.toString());
							cb(e);
						}						
					});
				} else {
					cb(null);
				}
			} catch (e) {
				that.journal.error(e.stack.toString());
				cb(e);
			}
		};
		iterator(0, cb);
	} catch (e) {
		that.journal.error(e.stack.toString());
		cb(e);
	}
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

Handler.prototype.process = function () {

	var that = this;

	try {
		if (that.settings.delay && that.settings.operate) {
			var delayTimerId = setInterval(function() {
				try {
					clearInterval(delayTimerId);
					that.operate(that.settings.operate, function(err) {
						if (err) {
							that.journal.error(err.toString());
						}
					});
				} catch (e) {
					that.journal.error(e.stack.toString());
				}
			}, that.settings.delay);
		}
	} catch (e) {
		that.journal.error(e.stack.toString());
	}	
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

Handler.prototype.cread = function (data, responce) {

	var that = this;

	try {
		responce(new Error("Unknown channel"));
	} catch (e) {
		that.journal.error(e.stack.toString());
	}
};

Handler.prototype.cwrite = function (data, responce) {
	
	try {
		responce(new Error("Unknown channel"));
	} catch (e) {
		that.journal.error(e.stack.toString());
	}
};

Handler.prototype.cpub = function (data) {

};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports = Handler;