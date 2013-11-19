var Class = require("../core/class");
var Object = require("../core/object");

var CCore = require("../helpers/ccore").CCore;
var CJournal = require("../helpers/cjournal").CJournal;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var util = require("util");
var biodaq = require("biodaq"), BioDaq = biodaq.BioDaq;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var BioDaqHandler = Class.Inherit("BioDaqHandler", Object, function (name, context, settings) {
	
	Class.Construct(this, name);

	this.context = context;
	this.settings = settings;
	
	this.core = new CCore("CCoreHelper", context);
	this.journal = new CJournal("CJournalHelper", context);	

	return this;
});

BioDaqHandler.prototype.initialize = function (done) {

	var InstantDioCtrl = null;

	try {
		if (this.settings.type == "InstantDiCtrl") {
			this.controller = BioDaq.InstantDiCtrl.createInstantDiCtrl(this.settings.device);
		} else if (this.settings.type == "InstantDoCtrl") {
			this.controller = BioDaq.InstantDoCtrl.createInstantDoCtrl(this.settings.device);
		} else {
			var e = new Error("Unknown controller type");
			this.journal.error(e.toString());
			done(e);
			return;
		}

		this.controllerData = {
			data : {},
			list : {}
		};

		for (var id in this.settings.channels) {
			var mapping = id.split(",");
			var p = mapping[0];
			var c = mapping[1];

			if (this.controllerData.data[p] == undefined) {
				this.controllerData.data[p] = this.controller.ReadPort(parseInt(p));
			}

			if (this.controllerData.list[this.settings.channels[id].group] == undefined) {
				this.controllerData.list[this.settings.channels[id].group] = {};
			}
			
			this.controllerData.list[this.settings.channels[id].group][this.settings.channels[id].channel] = {
				"p": p, 
				"c": c,
				"lastValue": null
			};
		}

		done();
	} catch (e) {
		this.journal.error(e.toString());
		done(e);
	}
};

BioDaqHandler.prototype.release = function () {

};

BioDaqHandler.prototype.process = function () {

	var that = this;
	var isProcessing = false;

	setInterval(function() {

		if (isProcessing) {
			return;
		}

		isProcessing = true;

		try {
			var corePublish = function (group, channel, value) {
				try {
					that.core.cpub(group, channel, value, function (e) {
						if (e) {
							that.journal.error(e.toString());
						} else {
							that.journal.information(util.format("Published - group: %s, channel: %s, value: %s", group, channel, value));
						}
					});
				} catch (e) {
					that.journal.error(e.toString());
				}				
			};

			for (var p in that.controllerData.data) {
				that.controllerData.data[p] = that.controller.ReadPort(parseInt(p));
			}

			for (var group in that.controllerData.list) {
				for (var channel in that.controllerData.list[group]) {					
					var newValue = (that.controllerData.data[that.controllerData.list[group][channel].p] >> that.controllerData.list[group][channel].c) & 0x1;
					if (that.controllerData.list[group][channel].lastValue != newValue) {
						that.controllerData.list[group][channel].lastValue = newValue;
						corePublish(group, channel, newValue);
					}
				}
			}
				} catch (e) {
			that.journal.error(e.toString());
		}

		isProcessing = false;
		
	}, this.settings.update_interval);
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

BioDaqHandler.prototype.cread = function (data, responce) {

	var that = this;

	try {
		var id = this.controllerData.list[data.group][data.channel];
		var value = id.lastValue;

		if (value != undefined) {
			responce(null, value);
		} else {
			var e = new Error("Can't read channel value");
			this.journal.error(util.format("\"%s\" id: %s; data:%s", e.toString(), id.toString(), this.controllerData.data.toString()));
			responce(e);
		}	
	} catch (e) {
		this.journal.error(e.toString());
		responce(e);
	}	
};

BioDaqHandler.prototype.cwrite = function (data, responce) {
	
	var that = this;
	
	try {
		var id = this.controllerData.list[data.group][data.channel];		

		if (id != undefined) {
			var value = that.controller.ReadPort(parseInt(id.p)) & (0xff ^ (1 << id.c)) | (parseInt(data.value) << id.c);
			value = that.controller.WritePort(parseInt(id.p), value);
			responce(null, (value >> id.c) & 0x1);
		} else {
			var e = new Error("Can't write value to channel");
			this.journal.error(util.format("\"%s\" id: %s; data:%s", e.toString(), id.toString(), this.controllerData.data.toString()));
			responce(e);
		}	
	} catch (e) {
		this.journal.error(e.toString());
		responce(e);
	}
};

BioDaqHandler.prototype.cpub = function (data) {

};

BioDaqHandler.prototype.cupub = function (data) {

};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports = BioDaqHandler;