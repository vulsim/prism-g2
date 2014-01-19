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

	this.core = new CCore("CCoreHelper", context);
	this.journal = new CJournal("CJournalHelper", context);

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
	var info = {};

	try {
		that.getDeviceType(rawReadFunc, rawWriteFunc, devId, function (err, deviceType) {
			try {
				that.getDeviceSerial(rawReadFunc, rawWriteFunc, devId, function (err1, deviceSerial) {
					try {
						that.getCurrentRatio(rawReadFunc, rawWriteFunc, devId, function (err2, currentRatio) {
							try {
								that.getVoltageRatio(rawReadFunc, rawWriteFunc, devId, function (err3, voltageRatio) {
									try {
										that.getInstantCurrent(rawReadFunc, rawWriteFunc, devId, function (err4, instantCurrent) {
											try {
												that.getInstantVoltage(rawReadFunc, rawWriteFunc, devId, function (err5, instantVoltage) {
													try {
														that.getTotalConsumedEnery(rawReadFunc, rawWriteFunc, devId, function (err, totalEnergy) {
															try {
																that.getMonthConsumedEnery(rawReadFunc, rawWriteFunc, devId, function (err, monthEnergy) {
																	try {
																		if (err1 && err2) {
																			cb(new Error("Device cannot be read"));
																			return;
																		}

																		if (deviceType) {
																			info.device_type = deviceType.replace(/\s/g, "");
																		}

																		if (deviceSerial) {
																			info.device_serial = deviceSerial.replace(/\s/g, "");
																		}

																		if (currentRatio && instantCurrent) {
																			info.instant_current = [Math.round(instantCurrent[0] * currentRatio), Math.round(instantCurrent[1] * currentRatio), Math.round(instantCurrent[2] * currentRatio)];
																			info.instant_mean_current = Math.round((info.instant_current[0] + info.instant_current[1] + info.instant_current[2]) / 3.0);
																		}

																		if (voltageRatio && instantVoltage) {
																			info.instant_voltage = [Math.round(instantVoltage[0] * voltageRatio), Math.round(instantVoltage[1] * voltageRatio), Math.round(instantVoltage[2] * voltageRatio)];
																			info.instant_mean_voltage = Math.round((info.instant_voltage[0] + info.instant_voltage[1] + info.instant_voltage[2]) / 3.0);
																		}

																		if (totalEnergy && currentRatio && voltageRatio) {
																			info.input_active_energy = Math.round(totalEnergy.e_p * currentRatio * voltageRatio * 0.0001);
																			info.output_active_energy = Math.round(totalEnergy.e_n * currentRatio * voltageRatio * 0.0001);
																			info.total_active_energy = Math.round(info.input_active_energy + info.output_active_energy);

																			info.input_reactive_energy = Math.round(totalEnergy.r_p * currentRatio * voltageRatio * 0.0001);
																			info.output_reactive_energy = Math.round(totalEnergy.r_n * currentRatio * voltageRatio * 0.0001);
																			info.total_reactive_energy = Math.round(info.input_reactive_energy + info.output_reactive_energy);
																		}

																		if (monthEnergy && currentRatio && voltageRatio) {
																			info.input_month_active_energy = Math.round(monthEnergy.e_p * currentRatio * voltageRatio * 0.0001);
																			info.output_month_active_energy = Math.round(monthEnergy.e_n * currentRatio * voltageRatio * 0.0001);
																			info.input_month_reactive_energy = Math.round(monthEnergy.r_p * currentRatio * voltageRatio * 0.0001);
																			info.output_month_reactive_energy = Math.round(monthEnergy.r_n * currentRatio * voltageRatio * 0.0001);
																		}
																		
																		cb(null, info);
																	} catch (e) {
																		that.journal.error(e.stack.toString());
																		cb(e);
																	}			
																});
															} catch (e) {
																that.journal.error(e.stack.toString());
																cb(e);
															}			
														});														
													} catch (e) {
														that.journal.error(e.stack.toString());
														cb(e);
													}			
												});												
											} catch (e) {
												that.journal.error(e.stack.toString());
												cb(e);
											}			
										});																			
									} catch (e) {
										that.journal.error(e.stack.toString());
										cb(e);
									}			
								});															
							} catch (e) {
								that.journal.error(e.stack.toString());
								cb(e);
							}			
						});											
					} catch (e) {
						that.journal.error(e.stack.toString());
						cb(e);
					}			
				});
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

CC301.prototype.getDeviceType = function (rawReadFunc, rawWriteFunc, devId, cb) {

	var that = this;

	try {
		rawWriteFunc(that.rawRequestPacket(devId, 3, 17, 0, 0 ,0), function (err) {
			try {
				rawReadFunc(250, function (err, rawData) {
					try {
						var data = that.rawResponsePacket(rawData);
						if (data && data.data && data.func == 3 && data.param == 17 && data.result == 0) {
							cb(null, data.data.toString());
						} else {
							cb(new Error("An error occurred when reading from device"));
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
		});
	} catch (e) {
		that.journal.error(e.stack.toString());
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
						if (data && data.data && data.func == 3 && data.param == 18 && data.result == 0) {
							cb(null, data.data.toString());
						} else {
							cb(new Error("An error occurred when reading from device"));
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
		});
	} catch (e) {
		that.journal.error(e.stack.toString());
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
						if (data && data.data && data.func == 3 && data.param == 1 && data.result == 0) {
							cb(null, {
								"e_p" : data.data.readInt32LE(0),
								"e_n" : data.data.readInt32LE(4),
								"r_p" : data.data.readInt32LE(8),
								"r_n" : data.data.readInt32LE(12)
							});
						} else {
							cb(new Error("An error occurred when reading from device"));
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
		});
	} catch (e) {
		that.journal.error(e.stack.toString());
		cb(e);
	}
};

CC301.prototype.getMonthConsumedEnery = function (rawReadFunc, rawWriteFunc, devId, cb) {

	var that = this;

	try {
		rawWriteFunc(that.rawRequestPacket(devId, 3, 3, -1, 0 ,0), function (err) {
			try {
				rawReadFunc(250, function (err, rawData) {
					try {
						var data = that.rawResponsePacket(rawData);
						if (data && data.data && data.func == 3 && data.param == 3 && data.result == 0) {
							cb(null, {
								"e_p" : data.data.readInt32LE(0),
								"e_n" : data.data.readInt32LE(4),
								"r_p" : data.data.readInt32LE(8),
								"r_n" : data.data.readInt32LE(12)
							});
						} else {
							cb(new Error("An error occurred when reading from device"));
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
		});
	} catch (e) {
		that.journal.error(e.stack.toString());
		cb(e);
	}
};

CC301.prototype.getCurrentRatio = function (rawReadFunc, rawWriteFunc, devId, cb) {

	var that = this;

	try {
		rawWriteFunc(that.rawRequestPacket(devId, 3, 25, 0, 0 ,0), function (err) {
			try {
				rawReadFunc(250, function (err, rawData) {
					try {
						var data = that.rawResponsePacket(rawData);
						if (data && data.data && data.func == 3 && data.param == 25 && data.result == 0) {
							cb(null, data.data.readInt32LE(0));
						} else {
							cb(new Error("An error occurred when reading from device"));
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
		});
	} catch (e) {
		that.journal.error(e.stack.toString());
		cb(e);
	}
};

CC301.prototype.getVoltageRatio = function (rawReadFunc, rawWriteFunc, devId, cb) {
	
	var that = this;

	try {
		rawWriteFunc(that.rawRequestPacket(devId, 3, 26, 0, 0 ,0), function (err) {
			try {
				rawReadFunc(250, function (err, rawData) {
					try {
						var data = that.rawResponsePacket(rawData);
						if (data && data.data && data.func == 3 && data.param == 26 && data.result == 0) {
							cb(null, data.data.readInt32LE(0));
						} else {
							cb(new Error("An error occurred when reading from device"));
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
		});
	} catch (e) {
		that.journal.error(e.stack.toString());
		cb(e);
	}
};

CC301.prototype.getInstantCurrent = function (rawReadFunc, rawWriteFunc, devId, cb) {
	
	var that = this;

	try {
		rawWriteFunc(that.rawRequestPacket(devId, 3, 11, 0, 0 ,0), function (err) {
			try {
				rawReadFunc(250, function (err, rawData) {
					try {
						var data = that.rawResponsePacket(rawData);
						if (data && data.data && data.func == 3 && data.param == 11 && data.result == 0) {
							cb(null, [data.data.readFloatLE(0), data.data.readFloatLE(4), data.data.readFloatLE(8)]);
						} else {
							cb(new Error("An error occurred when reading from device"));
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
		});
	} catch (e) {
		that.journal.error(e.stack.toString());
		cb(e);
	}
};


CC301.prototype.getInstantVoltage = function (rawReadFunc, rawWriteFunc, devId, cb) {
	
	var that = this;

	try {
		rawWriteFunc(that.rawRequestPacket(devId, 3, 10, 0, 0 ,0), function (err) {
			try {
				rawReadFunc(250, function (err, rawData) {
					try {
						var data = that.rawResponsePacket(rawData);
						if (data && data.data && data.func == 3 && data.param == 10 && data.result == 0) {
							cb(null, [data.data.readFloatLE(0), data.data.readFloatLE(4), data.data.readFloatLE(8)]);
						} else {
							cb(new Error("An error occurred when reading from device"));
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
		});
	} catch (e) {
		that.journal.error(e.stack.toString());
		cb(e);
	}
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports.CC301 = CC301;