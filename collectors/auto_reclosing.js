var Class = require("../core/class");
var Object = require("../core/object");

var Automation = require("../helpers/automation").Automation;
var Alarms = require("../helpers/alarms").Alarms;
var CCore = require("../helpers/ccore").CCore;
var CJournal = require("../helpers/cjournal").CJournal;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var util = require("util");

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var Handler = Class.Inherit("Reclosing", Object, function (name, context, settings) {
	
	Class.Construct(this, name);

	this.context = context;
	this.settings = settings;
	

	this.core = new CCore("CCoreHelper", context);
	this.journal = new CJournal("CJournalHelper", context);
	this.automation = new Automation("AutomationHelper", context);

	return this;
});

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

Handler.prototype.initialize = function (done) {

	var that = this;

	try {		
		this.alarms = new Alarms("AlarmsHelper", this.context, this.settings.alarms);
		this.group = this.settings.group;
		this.channel = this.settings.channel;
		this.check_active = this.settings.active;
		this.check_idle = this.settings.idle;
		this.check_control = this.settings.control;
		this.operate_control = this.settings.operate;

		done();
	} catch (e) {
		that.journal.error(e.stack.toString());
		done(e);
	}
};

Handler.prototype.release = function () {

};

Handler.prototype.process = function () {

	var that = this;

	that.lock = 0;
	that.is_idle = true;
	that.is_first = true;
	that.is_active = false;	
	that.is_control = false;

	try {		
		var processTimerId = setInterval(function() {
			try {
				if (that.is_active) {
					return;
				}
			
				that.is_active = true;

				if (that.is_idle || that.is_first || that.lock > 0) {
					if (that.is_first) {
						that.is_first = false;
						that.alarms.set(that.channel + "-100", null, function (err) {
							try {
								that.core.cpub(that.group, that.channel, "I", function (e) {
									that.is_active = false;
								});
							} catch (e) {
								that.journal.error(e.stack.toString());
								that.is_active = false;
							}
						});
					} else if (that.lock > 0) {
						that.is_idle = true;
						that.lock = that.lock - 1;
						that.alarms.set(that.channel + "-100", null, function (err) {
							try {
								that.core.cpub(that.group, that.channel, "I", function (e) {
									that.is_active = false;
								});
							} catch (e) {
								that.journal.error(e.stack.toString());
								that.is_active = false;
							}
						});
					} else {
						that.automation.check(that.check_active, false, function (result) {
							try {
								if (result) {
									that.alarms.reset(that.channel + "-100", function (err) {
										try {
											that.is_idle = false;									
											that.alarms.reset(that.channel + "-101", function (err) {
												try {
													that.alarms.reset(that.channel + "-102", function (err) {												
														try {
															that.core.cpub(that.group, that.channel, "A", function (e) {
																that.is_active = false;
															});
														} catch (e) {
															that.journal.error(e.stack.toString());
															that.is_active = false;
														}
													});
												} catch (e) {
													that.journal.error(e.stack.toString());
													that.is_active = false;
												}
											});
										} catch (e) {
											that.journal.error(e.stack.toString());
											that.is_active = false;
										}								
									});														
								} else {
									that.is_active = false;
								}
							} catch (e) {
								that.journal.error(e.stack.toString());
								that.is_active = false;
							}
						});					
					}					
				} else {
					that.automation.check(that.check_idle, false, function (idleResult) {
						try {
							if (idleResult) {
								that.is_idle = true;
								that.alarms.reset(that.channel + "-100", function (err) {
									try {
										that.core.cpub(that.group, that.channel, "I", function (e) {																										
											try {
												that.is_active = false;
											} catch (e) {
												that.journal.error(e.stack.toString());
												that.is_active = false;
											}
										});									
									} catch (e) {
										that.journal.error(e.stack.toString());
										that.is_active = false;
									}
								});								
							} else {
								that.automation.check(that.check_control, false, function (result) {
									try {
										if (result) {
											that.journal.information(util.format("Start watching 1nd for reclosing: %s,%s", that.group, that.channel));
											var delayTimerId1 = setInterval(function() {
												try {
													clearInterval(delayTimerId1);
													that.operate(that.operate_control, function(err) {
														try {
															if (err) {
																that.journal.error(err.toString());
																that.alarms.set(that.channel + "-100", null, function (err) {
																	try {
																		that.is_idle = true;
																		that.alarms.set(that.channel + "-101", null, function (err) {
																			try {
																				var delayTimerId2 = setInterval(function() {
																					try {
																						clearInterval(delayTimerId2);
																						that.is_active = false;
																					} catch (e) {
																						that.journal.error(e.stack.toString());
																						that.is_active = false;
																					}
																				}, 10000);
																			} catch (e) {
																				that.journal.error(e.stack.toString());
																				that.is_active = false;
																			}																		
																		});	
																	} catch (e) {
																		that.journal.error(e.stack.toString());
																		that.is_active = false;
																	}																		
																});	
															} else {
																var delayTimerId3 = setInterval(function() {
																	try {
																		clearInterval(delayTimerId3);
																		that.automation.check(that.check_control, false, function (result) {
																			try {
																				if (result) {
																					that.journal.information(util.format("Start watching 2nd for reclosing: %s,%s", that.group, that.channel));
																					var delayTimerId4 = setInterval(function() {
																						try {
																							clearInterval(delayTimerId4);
																							that.operate(that.operate_control, function(err) {
																								try {
																									if (err) {
																										that.journal.error(err.toString());
																										that.alarms.set(that.channel + "-100", null, function (err) {
																											try {
																												that.is_idle = true;
																												that.core.cpub(that.group, that.channel, "I", function (e) {																										
																													try {
																														that.alarms.set(that.channel + "-101", null, function (err) {
																															try {
																																var delayTimerId5 = setInterval(function() {
																																	try {
																																		clearInterval(delayTimerId5);
																																		that.is_active = false;
																																	} catch (e) {
																																		that.journal.error(e.stack.toString());
																																		that.is_active = false;
																																	}
																																}, 10000);
																															} catch (e) {
																																that.journal.error(e.stack.toString());
																																that.is_active = false;
																															}																		
																														});
																													} catch (e) {
																														that.journal.error(e.stack.toString());
																														that.is_active = false;
																													}
																												});
																											} catch (e) {
																												that.journal.error(e.stack.toString());
																												that.is_active = false;
																											}																		
																										});	
																									} else {
																										var delayTimerId6 = setInterval(function() {
																											try {
																												clearInterval(delayTimerId6);
																												that.automation.check(that.check_control, false, function (result) {
																													try {
																														if (result) {
																															that.alarms.set(that.channel + "-100", null, function (err) {
																																try {
																																	that.is_idle = true;
																																	that.core.cpub(that.group, that.channel, "I", function (e) {																										
																																		try {
																																			that.alarms.set(that.channel + "-102", null, function (err) {
																																				try {
																																					var delayTimerId7 = setInterval(function() {
																																						try {
																																							clearInterval(delayTimerId7);
																																							that.is_active = false;
																																						} catch (e) {
																																							that.journal.error(e.stack.toString());
																																							that.is_active = false;
																																						}
																																					}, 10000);
																																				} catch (e) {
																																					that.journal.error(e.stack.toString());
																																					that.is_active = false;
																																				}																		
																																			});
																																		} catch (e) {
																																			that.journal.error(e.stack.toString());
																																			that.is_active = false;
																																		}																		
																																	});
																																} catch (e) {
																																	that.journal.error(e.stack.toString());
																																	that.is_active = false;
																																}																		
																															});
																														} else {												
																															that.is_active = false;
																														}
																													} catch (e) {
																														that.journal.error(e.stack.toString());
																														that.is_active = false;
																													}
																												});
																											} catch (e) {
																												that.journal.error(e.stack.toString());
																												that.is_active = false;
																											}
																										}, 5000);
																									}
																								} catch (e) {
																									that.journal.error(e.stack.toString());
																									that.is_active = false;
																								}
																							});
																						} catch (e) {
																							that.journal.error(e.stack.toString());
																							that.is_active = false;
																						}
																					}, 50000);
																				} else {												
																					that.is_active = false;
																				}
																			} catch (e) {
																				that.journal.error(e.stack.toString());
																				that.is_active = false;

																			}
																		});
																	} catch (e) {
																		that.journal.error(e.stack.toString());
																		that.is_active = false;
																	}
																}, 5000);
															}
														} catch (e) {
															that.journal.error(e.stack.toString());
															that.is_active = false;
														}
													});
												} catch (e) {
													that.journal.error(e.stack.toString());
													that.is_active = false;
												}
											}, 30000);
										} else {												
											that.is_active = false;
										}
									} catch (e) {
										that.journal.error(e.stack.toString());
										that.is_active = false;
									}
								});
							}
						} catch (e) {
							that.journal.error(e.stack.toString());
							that.is_active = false;
						}
					});
				}
			} catch (e) {				
				that.journal.error(e.stack.toString());
				that.is_active = false;
			}												
		}, this.settings.interval);
	} catch (e) {
		that.journal.error(e.stack.toString());
	}
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
							if (result == false) {
								that.core.cwrite(operate[index].group, operate[index].channel, operate[index].value, function (err, group, channel, value) {
									try {
										if (err) {
											cb(err);
										} else {
											var delayTimerId = setInterval(function() {
												clearInterval(delayTimerId);
												iterator(index + 1, cb);
												/*that.core.cread(operate[index].group, operate[index].channel, function (err, group, channel, value) {
													try {
														if (operate[index].value == value) {
															iterator(index + 1, cb);
														} else {
															cb(new Error("Control action does not give effect"));
														}
													} catch (e) {
														that.journal.error(e.stack.toString());
														cb(e);
													}
												});*/
											}, operate[index].delay);
										}
									} catch (e) {
										that.journal.error(e.stack.toString());
										cb(e);
									}
								});
							} else {
								cb(new Error("Operation cannot be completed"));
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
		responce(null, (that.is_idle) ? "I" : "A");		
	} catch (e) {
		that.journal.error(e.stack.toString());
	}
};

Handler.prototype.cwrite = function (data, responce) {
	
	var that = this;

	try {
		if (data.group == that.group && data.channel == that.channel) {
			that.lock = parseInt(data.value);
			responce(null, "LOCK");
		} else {
			responce(new Error("Operation is not allowed"))
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