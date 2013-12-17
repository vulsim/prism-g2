var Class = require("../core/class");
var Object = require("../core/object");

var CCore = require("../helpers/ccore").CCore;
var CJournal = require("../helpers/cjournal").CJournal;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var util = require("util");
var crc = require("../helpers/crc");

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var CC301 = Class.Inherit("CC301", Object, function (name, context) {
	
	Class.Construct(this, name);

	//this.core = new CCore("CCoreHelper", context);
	//this.journal = new CJournal("CJournalHelper", context);

	return this;
});

CC301.prototype.rawRequestPacket = function (address, func, param, offset, tariff, dummy) {

	var buffer = new Buffer(8);
	var crcSum = 0xFFFF;

	buffer[0] = parseInt(address);
	buffer[1] = parseInt(func);
	buffer[2] = parseInt(param);
	buffer[3] = parseInt(offset);
	buffer[4] = parseInt(tariff);
	buffer[5] = parseInt(dummy);

	for (var i = 0; i < buffer.length - 2; i++) {
		crcSum = crc.crc16_ARC_Add(crcSum, buffer[i]);
	}

	buffer[6] = (crcSum >> 8) & 0xFF;
	buffer[7] = crcSum & 0xFF;

	return buffer;
};

CC301.prototype.rawResponsePacket = function (buffer) {

	if (buffer && buffer.length > 5) {
		var crcSum = 0xFFFF;

		for (var i = 0; i < buffer.length - 2; i++) {
			crcSum = crc.crc16_ARC_Add(crcSum, buffer[i]);
		}

		if ((parseInt(buffer[buffer.length - 2]) << 8) + (parseInt(buffer[buffer.length - 1])) == crcSum) {
			var ret = {
				"address" : buffer[0],
				"func" : buffer[1],
				"param" : buffer[2],
				"result" : buffer[3]
			};

			if (buffer.length > 6) {
				var data = new Buffer(buffer.length - 6);

				for (var i = 0; i < buffer.length - 6; i++) {
					data[i] = buffer[i + 4];
				}

				ret.data = data;
			}

			return ret;
		}		
	}
	
	return null;
};


CC301.prototype.getDeviceInfo = function (rawReadFunc, rawWriteFunc, devId, cb) {

	var that = this;

	try {
		
	} catch (e) {
		//that.journal.error(e.stack.toString());
		console.log(e.stack.toString());
		cb(e);
	}
};

CC301.prototype.getDeviceType = function (rawReadFunc, rawWriteFunc, devId, cb) {

	var that = this;

	try {
		rawWriteFunc(that.rawRequestPacket(devId, 3, 17, 0, 0 ,0), function (err) {
			try {
				rawReadFunc(250, function (err, rawData) {
					try {
						var data = that.rawResponsePacket(rawData);
						if (data && data.func == 3 && data.param == 17 && data.result == 0) {
							cb(null, data.data);
						} else {
							cb(new Error("An error occurred when reading from device"));
						}
					} catch (e) {
						//that.journal.error(e.stack.toString());
						console.log(e.stack.toString());
						cb(e);
					}
				});
			} catch (e) {
				//that.journal.error(e.stack.toString());
				console.log(e.stack.toString());
				cb(e);
			}
		});
	} catch (e) {
		//that.journal.error(e.stack.toString());
		console.log(e.stack.toString());
		cb(e);
	}
};

CC301.prototype.getDeviceSerial = function (rawReadFunc, rawWriteFunc, devId, cb) {

	var that = this;

	try {
		rawWriteFunc(that.rawRequestPacket(devId, 3, 18, 0, 0 ,0), function (err) {
			try {
				rawReadFunc(250, function (err, rawData) {
					try {
						var data = that.rawResponsePacket(rawData);
						if (data && data.func == 3 && data.param == 18 && data.result == 0) {
							cb(null, data.data);
						} else {
							cb(new Error("An error occurred when reading from device"));
						}
					} catch (e) {
						//that.journal.error(e.stack.toString());
						console.log(e.stack.toString());
						cb(e);
					}
				});
			} catch (e) {
				//that.journal.error(e.stack.toString());
				console.log(e.stack.toString());
				cb(e);
			}
		});
	} catch (e) {
		//that.journal.error(e.stack.toString());
		console.log(e.stack.toString());
		cb(e);
	}
};

CC301.prototype.getTotalConsumedEnery = function (rawReadFunc, rawWriteFunc, devId, cb) {
	var that = this;

	try {
		rawWriteFunc(that.rawRequestPacket(devId, 3, 1, 0, 0 ,0), function (err) {
			try {
				rawReadFunc(250, function (err, rawData) {
					try {
						var data = that.rawResponsePacket(rawData);
						if (data && data.func == 3 && data.param == 1 && data.result == 0) {
							cb(null, data.data);
						} else {
							cb(new Error("An error occurred when reading from device"));
						}
					} catch (e) {
						//that.journal.error(e.stack.toString());
						console.log(e.stack.toString());
						cb(e);
					}
				});
			} catch (e) {
				//that.journal.error(e.stack.toString());
				console.log(e.stack.toString());
				cb(e);
			}
		});
	} catch (e) {
		//that.journal.error(e.stack.toString());
		console.log(e.stack.toString());
		cb(e);
	}
};

CC301.prototype.getInstantValues = function (rawReadFunc, rawWriteFunc, devId, cb) {
	var that = this;

	try {
		rawWriteFunc(that.rawRequestPacket(devId, 3, 46, 0, 0 ,0), function (err) {
			try {
				rawReadFunc(250, function (err, rawData) {
					try {
						var data = that.rawResponsePacket(rawData);
						if (data && data.func == 3 && data.param == 46 && data.result == 0) {
							cb(null, data.data);
						} else {
							cb(new Error("An error occurred when reading from device"));
						}
					} catch (e) {
						//that.journal.error(e.stack.toString());
						console.log(e.stack.toString());
						cb(e);
					}
				});
			} catch (e) {
				//that.journal.error(e.stack.toString());
				console.log(e.stack.toString());
				cb(e);
			}
		});
	} catch (e) {
		//that.journal.error(e.stack.toString());
		console.log(e.stack.toString());
		cb(e);
	}
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports.CC301 = CC301;