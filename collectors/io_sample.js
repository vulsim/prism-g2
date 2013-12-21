var Class = require("../core/class");
var Object = require("../core/object");

var CCore = require("../helpers/ccore").CCore;
var CJournal = require("../helpers/cjournal").CJournal;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var util = require("util");

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var Handler = Class.Inherit("SampleHandler", Object, function (name, context, settings) {
		
	Class.Construct(this, name);

	this.context = context;
	this.settings = settings;
	
	this.core = new CCore("CCoreHelper", context);
	this.journal = new CJournal("CJournalHelper", context);

	return this;
});

var SimpleCall = function (context, params, cbBridge) {
	
	if (typeof(cbBridge) == undefined) {
		return;
	}
	
	Function.call.apply(cbBridge, [].concat(context, params));
};

Handler.prototype.initialize = function (done) {

	var that = this;

	try {		
		that.channels = (that.settings.publish) ? that.settings.publish : [];
		//console.log(that.core.that.name);

		var pubIterator = function (index, cb) {
			try {
				if (that.channels[index]) {
					//console.log(that.core.uuid);				
					//console.log(that.core.that.name);
					that.core.cpub(that.channels[index].group, that.channels[index].channel, that.channels[index].value, function (e) {
						try {
							if (e) {
								cb(e);
							} else {
								pubIterator(index + 1, cb);
							}
						} catch (e) {
							cb(e);
						}			
					});

				} else {
					cb();
				}
			} catch (e) {
				cb(e);
			}
		};

		pubIterator(0, function (err) {
			if (err) {
				that.journal.error(e);
			}
			done(err);
		})
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
			
	} catch (e) {
		that.journal.error(e.stack.toString());
	}	
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

Handler.prototype.cread = function (data, responce) {

	var that = this;

	//console.log(data);

	try {
		var channel = null;

		for (var index in that.channels) {
			if (that.channels[index].group == data.group && that.channels[index].channel == data.channel) {
				responce(null, that.channels[index].value);
				return;
			}
		}
		responce(new Error("Unknown channel"));
	} catch (e) {
		that.journal.error(e.stack.toString());
	}
};

Handler.prototype.cwrite = function (data, responce) {
	
	var that = this;

	try {
		var channel = null;

		for (var index in that.channels) {
			if (that.channels[index].group == that.group && that.channels[index].channel == data.channel) {
				that.channels[index].value = data.value;
				responce(null, that.channels[index].value);
				return;
			}
		}
		responce(new Error("Unknown channel"));
	} catch (e) {
		that.journal.error(e.stack.toString());
	}
};

Handler.prototype.cpub = function (data) {

};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports = Handler;