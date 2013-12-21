var Class = require("../core/class");
var Object = require("../core/object");

var Automation = require("../helpers/automation").Automation;
var CCore = require("../helpers/ccore").CCore;
var CJournal = require("../helpers/cjournal").CJournal;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var util = require("util");

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var Handler = Class.Inherit("Alarm", Object, function (name, context, settings) {
	
	Class.Construct(this, name);

	this.context = context;
	this.settings = settings;
	
	this.core = new CCore("CCoreHelper", context);
	this.journal = new CJournal("CJournalHelper", context);
	this.automation = new Automation("AutomationHelper", context);

	return this;
});

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

Handler.prototype.set = function (message, cb) {

	var that = this;

	try {				
		that.value = (message) ? message : ((that.settings.value) ? that.settings.value : "[U]");
		that.core.cpub(that.group, that.channel, that.value, function (err) {
			if (err) {
				cb(err);
			} else {
				that.journal.information(util.format("[%s,%s] Set alarm: %s", that.group, that.channel, that.value));				
				cb();
			}				
		});
	} catch (e) {
		cb(e);
	}
};

Handler.prototype.reset = function (cb) {

	var that = this;

	try {
		that.value = "";
		that.core.cupub(that.group, that.channel, function (err) {
			if (err) {
				cb(err);
			} else {
				that.journal.information(util.format("[%s,%s] Reset alarm", that.group, that.channel));				
				cb();
			}				
		});
	} catch (e) {
		cb(e);
	}
};


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

Handler.prototype.initialize = function (done) {

	var that = this;

	try {		
		that.group = that.settings.group;
		that.channel = that.settings.channel;
		that.manual_channel = that.channel + "-manual";
		that.states = [
			{
				"conform" : {},
				"count" : 1,
				"value" : 0
			},
			{
				"conform" : {},
				"count" : 1,
				"value" : 0
			},
		];		
		that.currentState = 0;
		that.value = "";

		if (that.settings.states) {
			for (var index in that.settings.states) {				
				if (that.settings.states[index].state == "R") {
					that.states[0].conform = that.settings.states[index].conform;
					that.states[0].count = that.settings.states[index].count;
				} else if (that.settings.states[index].state == "S") {
					that.states[1].conform = that.settings.states[index].conform;
					that.states[1].count = that.settings.states[index].count;
				}
			}
		}		
		
		that.core.cpub(that.group, that.manual_channel, "", function (e) {
			try {
				if (e) {
					that.journal.error(e.toString());
					done(e);
				} else {
					that.journal.information(util.format("Created manual set handler for alarm: %s,%s", that.group, that.channel));

					if (that.currentState) {
						that.set(null, function (err) {
							if (err) {
								that.journal.error(util.format("[%s,%s] Error occurred when set alarm: ", that.group, that.channel, err.toString()));
							}
						});
					}
					done();
				}
			} catch (e) {
				that.journal.error(e.stack.toString());
				done(e);
			}			
		});
	} catch (e) {
		that.journal.error(e.stack.toString());
		done(e);
	}
};

Handler.prototype.release = function () {

};

Handler.prototype.process = function () {

	var that = this;

	try {
		if (that.settings.interval) {
			that.operate = false; 
			that.schedulerTimer = setInterval(function() {
				try {
					if (that.operate) {
						return;
					}

					that.automation.check(that.states[1 - that.currentState].conform, false, function (result) {						
						try {
							if (result) {
								that.states[1 - that.currentState].value++;

								if (that.states[1 - that.currentState].value >= that.states[1 - that.currentState].count) {
									that.states[1 - that.currentState].value = 0;
									that.currentState = 1 - that.currentState;

									if (that.currentState) {
										that.set(null, function (err) {
											if (err) {
												that.journal.error(util.format("[%s,%s] Error occurred when set alarm: ", that.group, that.channel, err.toString()));
											}
											that.operate = false;
										});
									} else {
										that.reset(function (err) {
											if (err) {
												that.journal.error(util.format("[%s,%s] Error occurred when reset alarm: ", that.group, that.channel, err.toString()));
											}									
											that.operate = false;
										});
									}
								} else {
									that.operate = false;
								}
							} else {
								that.operate = false;
							}
						} catch (e) {
							that.journal.error(e.stack.toString());
							that.operate = false;
						}						
					});
				} catch (e) {
					that.journal.error(e.stack.toString());
					that.operate = false;
				}
			}, that.settings.interval);
		}		
	} catch (e) {
		that.journal.error(e.stack.toString());
	}
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

Handler.prototype.cread = function (data, responce) {

	var that = this;

	try {
		if (data.group == that.group && data.channel == that.channel) {
			responce(null, that.value);
		} else {
			responce(new Error("Unknown alarm"));
		}		
	} catch (e) {
		that.journal.error(e.stack.toString());
	}
};

Handler.prototype.cwrite = function (data, responce) {
	
	var that = this;

	try {		
		if (data.group == that.group && data.channel == that.manual_channel) {
			if (data.value) {
				that.set(data.value, function (err) {
					if (err) {
						responce(new Error("During setting alarm error occurred"))
					} else {
						responce(null, that.value);
					}					
				});
			} else {
				that.reset(function (err) {
					if (err) {
						responce(new Error("During resetting alarm error occurred"))
					} else {
						responce(null, that.value);
					}					
				});
			}
		} else {
			responce(new Error("Unknown alarm control channel"));
		}		
	} catch (e) {
		that.journal.error(e.stack.toString());
	}
};

Handler.prototype.cpub = function (data) {

};

Handler.prototype.cupub = function (data) {

};


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports = Handler;