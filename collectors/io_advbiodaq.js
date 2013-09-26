var Class = require("../core/class");
var Object = require("../core/object");

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var util = require("util");
var biodaq = require("biodaq"), BioDaq = biodaq.BioDaq;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var BioDaqHandler = Class.Inherit("BioDaqHandler", Object, function (name, core, journal, settings) {
	
	Class.Construct(this, name);

	this.core = core;
	this.journal = journal;
	this.settings = settings;	

	return this;
});

BioDaqHandler.prototype.initialize = function (done) {

	if (this.settings.type == "InstantDiCtrl") {
		
		var statusOk = false;

		try {			
			this.controller = BioDaq.InstantDiCtrl.createInstantDiCtrl(this.settings.device);
			this.InstantDiCtrlData = {
				data : {},
				list : {}
			};

			for (var id in this.settings.channels) {
				var mapping = id.split(",");
				var p = mapping[0];
				var c = mapping[1];

				if (this.InstantDiCtrlData.data[p] == undefined) {
					this.InstantDiCtrlData.data[p] = this.controller.ReadPort(parseInt(p));
				}

				if (this.InstantDiCtrlData.list[this.settings.channels[id].group] == undefined) {
					this.InstantDiCtrlData.list[this.settings.channels[id].group] = {};
				}
				
				this.InstantDiCtrlData.list[this.settings.channels[id].group][this.settings.channels[id].channel] = {
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
	} else {
		var e = new Error("Unknown controller type");
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
			for (var p in that.InstantDiCtrlData.data) {
				that.InstantDiCtrlData.data[p] = that.controller.ReadPort(parseInt(p));
			}

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

			for (var group in that.InstantDiCtrlData.list) {
				for (var channel in that.InstantDiCtrlData.list[group]) {					
					var newValue = (that.InstantDiCtrlData.data[that.InstantDiCtrlData.list[group][channel].p] >> that.InstantDiCtrlData.list[group][channel].c) & 0x1;
					if (that.InstantDiCtrlData.list[group][channel].lastValue != newValue) {
						that.InstantDiCtrlData.list[group][channel].lastValue = newValue;
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

	try {
		var id = this.InstantDiCtrlData.list[data.group][data.channel];
		var value = id.lastValue;

		if (value != undefined) {
			responce(null, value);
		} else {
			var e = new Error("Can't read channel value");
			this.journal.error(util.format("\"%s\" id: %s; data:%s", e.toString(), id.toString(), this.InstantDiCtrlData.data.toString()));
			responce(e);
		}	
	} catch (e) {
		this.journal.error(e.toString());
		responce(e);
	}	
};

BioDaqHandler.prototype.cwrite = function (data, responce) {
	responce(null);
};

BioDaqHandler.prototype.cpub = function (data) {

};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports = BioDaqHandler;