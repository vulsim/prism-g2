var Class = require("../core/class");
var Object = require("../core/object");

var Automation = require("../helpers/automation").Automation;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var util = require("util");

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var Handler = Class.Inherit("Control", Object, function (name, core, journal, settings) {
	
	Class.Construct(this, name);

	this.core = core;
	this.journal = journal;
	this.settings = settings;

	return this;
});

Handler.prototype.initialize = function (done) {

	var that = this;

	try {

		this.automation = new Automation("AutomationHelper", this.core, this.journal);
		this.group = this.settings.group;
		this.channel = this.settings.channel;
		this.states = this.settings.states;
		
		var value = "U";

		that.core.cpub(that.group, that.channel, value, function (e) {
			if (e) {
				that.journal.error(e.toString());
				done(e);
			} else {
				that.journal.information(util.format("Published - group: %s, channel: %s, value: %s", that.group, that.channel, value));
				done();
			}
		});
	} catch (e) {
		this.journal.error(e.stack.toString());
		done(e);
	}
};

Handler.prototype.release = function () {

};

Handler.prototype.process = function () {

	var that = this;

};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

Handler.prototype.getState = function (cb) {

	var that = this;

	try {
		var iterator = function (index, cb) {
			try {
				if (that.states[index]) {
					that.automation.check(that.states[index].conform, false, function (result) {						
						try {
							if (result) {
								cb(that.states[index].state);
							} else {
								iterator(index + 1, cb);
							}
						} catch (e) {
							that.journal.error(e.toString());
							cb(null);
						}						
					});
				} else {
					cb("U");
				}
			} catch (e) {
				that.journal.error(e.toString());
				cb(null);
			}
		};
		iterator(0, cb);
	} catch (e) {
		that.journal.error(e.toString());
		cb(null);
	}
};

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

Handler.prototype.cread = function (data, responce) {
	
	var that = this;

	try {
		that.getState(function (state) {
			try {
				if (state) {
					responce(null, state);
				} else {
					responce(new Error("Error occured when getting state"));					
				}
			} catch (e) {
				that.journal.error(e.toString());
				responce(e);
			}
		});
	} catch (e) {
		that.journal.error(e.toString());
	}
};

Handler.prototype.cwrite = function (data, responce) {
	
	var that = this;

	try {
		if (data.group == that.group && data.channel == that.channel) {
			for (var index in that.states) {
				if (that.states[index].state == data.value) {					
					that.automation.check(that.states[index].lock, false, function (result) {
						try {
							if (result) {
								responce(new Error("Operation is not allowed"))
							} else {
								that.operate(that.states[index].operate, function (err) {
									try {
										if (err) {
											responce(err);
										} else {
											that.getState(function (state) {
												try {
													if (state) {
														responce(null, state);
													} else {
														responce(new Error("Impossible to determine the resulting state")); 
													}													
												} catch (e) {
													that.journal.error(e.stack.toString());
													responce(e);
												}
											});
										}
									} catch (e) {
										that.journal.error(e.stack.toString());
										responce(e);
									}
								});
							}
						} catch (e) {
							that.journal.error(e.stack.toString());
							responce(e);
						}
					});		
					return;
				}
			}
			responce(new Error("Unknown state"));
		} else {
			responce(new Error("Malformed data"));
		}
	} catch (e) {
		that.journal.error(e.stack.toString());
		responce(e);
	}
};

Handler.prototype.cpub = function (data) {

};

Handler.prototype.cupub = function (data) {

};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports = Handler;