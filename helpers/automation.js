var Class = require("../core/class");
var Object = require("../core/object");

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var util = require("util");

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var Automation = Class.Inherit("Automation", Object, function (name, core, journal) {
	
	Class.Construct(this, name);

	this.core = core;
	this.journal = journal;

	return this;
});

Automation.prototype.check = function (condition, defaultValue, cb) {

	var that = this;
	
	try {
		var iterator = function (element, index, lastValue, cb) {
			try {
				if (element.group && element.channel && element.value) {
					that.core.cread(element.group, element.channel, function (err, group, channel, value) {
						try {
							if (err == null) {
								cb(element.value == value);
							} else {
								cb(false);
							}
						} catch (e) {
							that.journal.error(e.toString());
						}
					});
				} else if (element.and) {
					if (index == 0) {
						lastValue = true;
					}

					if (element.and[index]) {
						iterator(element.and[index], 0, false, function (result) {
							try {
								if (result) {
									iterator(element, index + 1, true, cb);
								} else {
									cb(false);
								}
							} catch (e) {
								that.journal.error(e.toString());
							}
						});
					} else {
						cb(lastValue);	
					}
				} else if (operand.or){
					if (index == 0) {
						lastValue = false;
					}

					if (element.or[index]) {
						iterator(element.or[index], 0, false, function (result) {
							try {
								if (result) {
									cb(true);
								} else {
									iterator(element, index + 1, false, cb);
								}
							} catch (e) {
								that.journal.error(e.toString());
							}
						});
					} else {
						cb(lastValue);	
					}
				} else {
					cb(lastValue);
				}
			} catch (e) {
				that.journal.error(e.toString());
			}
		};
		iterator(condition, 0, defaultValue, cb);
	} catch (e) {
		that.journal.error(e.toString());
	}
};

Automation.prototype.linear = function (condition, cb) {

	var that = this;

	try {
		var iterator = function (element, index, result, cb) {
			try {
				if (element.group && element.channel && element.value) {
					result.push({"group" : element.group, "channel" : element.channel});
					cb(result);
				} else if (element.and) {
					if (element.and[index]) {
						iterator(element.and[index], 0, false, function (result) {
							try {
								iterator(element, index + 1, result, cb);								
							} catch (e) {
								that.journal.error(e.toString());
							}
						});
					} else {
						cb(result);	
					}
				} else if (operand.or){
					if (element.and[index]) {
						iterator(element.and[index], 0, false, function (result) {
							try {
								iterator(element, index + 1, result, cb);
							} catch (e) {
								that.journal.error(e.toString());
							}
						});
					} else {
						cb(result);	
					}
				} else {
					cb(result);
				}
			} catch (e) {
				that.journal.error(e.toString());
			}
		};
		iterator(condition, 0, [], cb);
	} catch (e) {
		that.journal.error(e.toString());
	}
};

Automation.prototype.value = function (group, channel, cb) {

	var that = this;

	try {
		that.core.cread(group, channel, function (err, group, channel, value) {
			cb((err) ? null : value);
		});
	} catch (e) {
		that.journal.error(e.toString());
	}
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports.Automation = Automation;