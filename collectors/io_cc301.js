var Class = require("../core/class");
var Object = require("../core/object");

var CCore = require("../helpers/ccore").CCore;
var CJournal = require("../helpers/cjournal").CJournal;
var CC301 = require("../helpers/cc301").CC301;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var util = require("util");
var SerialPort = require("serialport").SerialPort;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var Handler = Class.Inherit("CC301", Object, function (name, context, settings) {
		
	Class.Construct(this, name);

	this.context = context;
	this.settings = settings;
	
	this.core = new CCore("CCoreHelper", context);
	this.journal = new CJournal("CJournalHelper", context);
	this.automation = new Automation("AutomationHelper", context);
	this.cc301 = new CC301("CC301", context);

	return this;
});

Handler.prototype.initialize = function (done) {

	var that = this;

	try {		
		that.devices = that.settings.devices;

		var serialPort = new SerialPort(that.settings.serial_port, that.settings.serial_options);

		serialPort.on('open', function(err) {
			if (err) {
				done(new Error("Cannot open serial port"));
			} else {
				serialPort.close(function (err) {
					done(null);
				});
			}
		});
	} catch (e) {
		that.journal.error(e.stack.toString());
		done(e);
	}
};

Handler.prototype.release = function () {

};

Handler.prototype.republish = function (device, info, cb) {

	try {
		var pubIterator = function (index, cb) {
			try {
				if (device.channels[index]) {
					var value = info[device.channels[index].param].toString();
					
					if (device.channels[index].value == null || device.channels[index].value != value) {
						device.channels[index].value = value;
						that.core.cpub(device.channels[index].group, device.channels[index].channel, device.channels[index].value, function (err) {
							try {
								pubIterator(index + 1, cb);
							} catch (e) {
								cb(e);
							}			
						});
					} else {
						pubIterator(index + 1, cb);
					}
				} else {
					cb();
				}
			} catch (e) {
				cb(e);
			}
		};		
	} catch (e) {
		that.journal.error(e.stack.toString());
		cb(e);
	}
};

Handler.prototype.process = function () {

	var that = this;

	try {
		if (that.settings.interval) {
			var queueActive = false;
			var queueTimerId = setInterval(function() {
				try {
					if (queueActive) {
						return;
					}

					queueActive = true;

					var rawReadHandler = function(timeout, rawReadCb) {
						try {
							var rawReadTimerId = setInterval(function() {
								try {
									clearInterval(rawReadTimerId);

									if (currentRawReadBuffer) {
										rawReadCb(null, currentRawReadBuffer);
										currentRawReadBuffer = null;
									} else {
										rawReadCb(new Error("No data received"), null);
									}			
								} catch (e) {
									rawReadCb(e);
								}
							}, timeout);
						} catch (e) {
							rawReadCb(e);
						}						
					};

					var rawWriteHandler = function (data, rawWriteCb) {
						try {
							serialPort.write(data, function(err, length) {
								rawWriteCb(err);
							});
						} catch (e) {
							rawWriteCb(e);
						}						
					};

					var currentRawReadBuffer = null;
					var serialPort = new SerialPort(that.settings.serial_port, that.settings.serial_options);

					serialPort.on('data', function(data) {
						if (currentRawReadBuffer) {
							currentRawReadBuffer = Buffer.concat([currentRawReadBuffer, data]);
						} else {
							currentRawReadBuffer = data;
						}
					});

					serialPort.on('open', function(err) {
						try {
							if (err == null) {
								var queueIterator = function (index, cb) {
									try {
										if (that.devices[index]) {
											cc301.getInstantValues(rawReadHandler, rawWriteHandler, that.devices[index].address, function (err, info) {
												try {
													if (info) {
														that.republish(that.devices[index], info, function () {
															queueIterator(index + 1, cb);
														});
													} else {
														queueIterator(index + 1, cb);
													}
												} catch (e) {
													queueIterator(index + 1, cb);
												}
											});
										} else {
											cb(null)
										}
									} catch (e) {
										cb(e);
									}
								};
								queueIterator(0, function () {
									queueActive = false;
								});
							}
						} catch (e) {
							that.journal.error(e.stack.toString());
							queueActive = false;
						}						
					});					
				} catch (e) {
					that.journal.error(e.stack.toString());
					queueActive = false;
				}
			}, that.settings.delay);
		}			
	} catch (e) {
		that.journal.error(e.stack.toString());
	}	
		}
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

Handler.prototype.cread = function (data, responce) {

	var that = this;

	try {
		var channel = null;

		for (var deviceIndex in that.devices) {
			for (var channelIndex in that.devices[deviceIndex]) {
				if (that.devices[deviceIndex].channels[channelIndex].group == data.group && that.devices[deviceIndex].channels[channelIndex].channel == data.channel) {
					responce(null, that.devices[deviceIndex].channels[channelIndex].value);
					return;
				}
			}			
		}
		responce(new Error("Unknown channel"));
	} catch (e) {
		that.journal.error(e.stack.toString());
	}
};

Handler.prototype.cwrite = function (data, responce) {
	
	try {		
		responce(new Error("Not supported"));
	} catch (e) {
		that.journal.error(e.stack.toString());
	}
};

Handler.prototype.cpub = function (data) {

};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports = Handler;