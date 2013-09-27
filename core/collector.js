var Class = require("./class");
var Object = require("./object");

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var util = require("util");

var Rpc = require("../core/rpc").Rpc;
var Type = require("../core/types").Type;
var journal = require("../core/journal").journal;


var BridgeCall = function (data, context, cbParams, cbBridge) {
	
	if (typeof(cbBridge) == undefined) {
		return;
	}

	if (data.status == Type.Status["FAIL"]) {		
		Function.call.apply(cbBridge, [].concat(context, new Error((data.error) ? data.error : "unknown")));		
	} else {
		Function.call.apply(cbBridge, [].concat(context, null, (cbParams) ? cbParams(data) : []));
	}
};

var SimpleCall = function (context, params, cbBridge) {
	
	if (typeof(cbBridge) == undefined) {
		return;
	}
	
	Function.call.apply(cbBridge, [].concat(context, params));
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var Collector = Class.Inherit("Collector", Object, function (name) {

	Class.Construct(this, name);

	return this;

}, true);

Collector.prototype.configure = function (master, handler, settings) {

	var Handler = null;

	try {
		Handler = require("../collectors/" + handler);
	} catch (e) {
		journal.error(this, e.stack.toString());		
	}
	
	if (Handler == null) {
		return null;
	}
	
	this.master = master;
	this.handler = handler;	
	this.instance = new Handler(this.name, this.core, this.journal, settings);
	
	this.core.that = this;
	this.journal.that = this;
	this.rpc_handler.that = this;
	
	if (this.instance.initialize == null || 
		this.instance.release == null || 
		this.instance.process == null || 
		this.instance.cread == null || 
		this.instance.cwrite == null) {		
		return null;
	}
	
	return this;
};

Collector.prototype.start = function () {
		
	var that = this;

	try {
		this.rpc = new Rpc("rpc");
		this.rpc.link(this.master.uuid, this.master.address, function (node_uuid, method, data, response) {
			try {
				var handler = that.rpc_handler[method];
				if (handler) {
					Function.call.apply(handler, [].concat(that, node_uuid, data, response)); 
				} else {
					journal.warning(that, util.format("Can't map method \"%s\", args: ", method, JSON.stringify(data)));
				}
			} catch (e) {
				journal.error(that, e.stack.toString(), 0);
			}
		});

		this.instance.initialize(function (err) {
			if (err) {
				journal.error(that, err.toString());
			} else {
				that.instance.process();
			}
		});

		journal.information(this, util.format("Collector with handler \"%s\" successfully initialized", this.handler));
	} catch (e) {
		journal.error(this, e.stack.toString(), 0);
	}
}

Collector.prototype.stop = function () {

	this.instance.release();
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Core

Collector.prototype.core = {

	"nop": function(cb) {	

		var that = this.that;

		try {
			that.rpc.send(that.master.uuid, "nop", {}, function (data) {
				try {
					BridgeCall(data, that.instance, null, cb);
				} catch (e) {
					journal.error(that, e.stack.toString());
					SimpleCall(that.instance, e, cb);
				}
			});
		} catch (e) {
			journal.error(that, e.stack.toString());
		}		
	},

	"glist": function(cb) {

		var that = this.that;

		try {
			that.rpc.send(that.master.uuid, "glist", {}, function (data) {
				try {
					BridgeCall(data, that.instance, function (data) {
						return [data.groups];
					}, cb);
				} catch (e) {
					journal.error(that, e.stack.toString());
					SimpleCall(that.instance, e, cb);					
				}
			});
		} catch (e) {
			journal.error(that, e.stack.toString());
		}		
	}, 
	
	"gsub": function(group, cb) {

		var that = this.that;

		try {
			that.rpc.send(that.master.uuid, "gsub", {"group":group}, function (data) {
				try {
					BridgeCall(data, that.instance, null, cb);
				} catch (e) {
					journal.error(that, e.stack.toString());
					SimpleCall(that.instance, e, cb);					
				}
			});
		} catch (e) {
			journal.error(that, e.stack.toString());
		}		
	},

	"gusub": function(group, cb) {

		var that = this.that;

		try {
			that.rpc.send(that.master.uuid, "gusub", {"group":group}, function (data) {
				try {
					BridgeCall(data, that.instance, null, cb);
				} catch (e) {
					journal.error(that, e.stack.toString());
					SimpleCall(that.instance, e, cb);					
				}
			});
		} catch (e) {
			journal.error(that, e.stack.toString());
		}			
	},

	"clist": function(cb) {

		var that = this.that;

		try {
			that.rpc.send(that.master.uuid, "clist", {}, function (data) {
				try {
					BridgeCall(data, that.instance, function (data) {
						return [data.channels];
					}, cb);
				} catch (e) {
					journal.error(that, e.stack.toString());
					SimpleCall(that.instance, e, cb);					
				}
			});
		} catch (e) {
			journal.error(that, e.stack.toString());
		}			
	},

	"cread": function(group, channel, cb) {

		var that = this.that;

		try {
			that.rpc.send(that.master.uuid, "cread", {"group":group, "channel":channel}, function (data) {
				try {					
					BridgeCall(data, that.instance, function (data) {
						return [group, channel, data.value];
					}, cb);
				} catch (e) {
					journal.error(that, e.stack.toString());
					SimpleCall(that.instance, e, cb);					
				}
			});
		} catch (e) {
			journal.error(that, e.stack.toString());
		}			
	},

	"cwrite": function(group, channel, value, cb) {

		var that = this.that;

		try {
			that.rpc.send(that.master.uuid, "cwrite", {"group":group, "channel":channel, "value":value}, function (data) {
				try {
					BridgeCall(data, that.instance, function (data) {
						return [group, channel, data.value];
					}, cb);
				} catch (e) {
					journal.error(that, e.stack.toString());
					SimpleCall(that.instance, e, cb);					
				}
			});
		} catch (e) {
			journal.error(that, e.stack.toString());
		}			
	},

	"cpub": function(group, channel, value, cb) {
		
		var that = this.that;

		try {
			that.rpc.send(that.master.uuid, "cpub", {"group":group, "channel":channel, "value":value}, function (data) {
				try {
					BridgeCall(data, that.instance, null, cb);
				} catch (e) {
					journal.error(that, e.stack.toString());
					SimpleCall(that.instance, e, cb);					
				}
			});
		} catch (e) {
			journal.error(that, e.stack.toString());
		}			
	},

	"cupub": function(group, channel, value, cb) {
		
		var that = this.that;

		try {
			that.rpc.send(that.master.uuid, "cupub", {"group":group, "channel":channel}, function (data) {
				try {
					BridgeCall(data, that.instance, null, cb);
				} catch (e) {
					journal.error(that, e.stack.toString());
					SimpleCall(that.instance, e, cb);					
				}
			});
		} catch (e) {
			journal.error(that, e.stack.toString());
		}			
	},

	"csub": function(group, channel, cb) {
		
		var that = this.that;

		try {
			that.rpc.send(that.master.uuid, "csub", {"group":group, "channel":channel}, function (data) {
				try {
					BridgeCall(data, that.instance, null, cb);
				} catch (e) {
					journal.error(that, e.stack.toString());
					SimpleCall(that.instance, e, cb);					
				}
			});
		} catch (e) {
			journal.error(that, e.stack.toString());
		}			
	},

	"cusub": function(group, channel, cb) {

		var that = this.that;

		try {
			that.rpc.send(that.master.uuid, "cusub", {"group":group, "channel":channel}, function (data) {
				try {
					BridgeCall(data, that.instance, null, cb);
				} catch (e) {
					journal.error(that, e.stack.toString());
					SimpleCall(that.instance, e, cb);					
				}
			});
		} catch (e) {
			journal.error(that, e.stack.toString());
		}			
	}
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Journal

Collector.prototype.journal = {

	"information": function(message) {
		journal.information(this.that.instance, message);
	},

	"warning": function(message) {
		journal.warning(this.that.instance, message);		
	},

	"error": function(message) {
		journal.error(this.that.instance, message);	
	}
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Handlers

Collector.prototype.rpc_handler = {

	"nop": function(node_uuid, data, response) {
		try {
			if (response) {
				response({
					"status":Type.Status["OK"]
				});
			}
		} catch (e) {
			journal.error(this, e.stack.toString());
		}		
	},

	"cread": function (node_uuid, data, response) {
		try {
			if (response) {
				this.instance.cread({"group":data.group, "channel":data.channel}, function (err, value) {
					try {
						if (err) {
							response({
								"status":Type.Status["FAIL"],
								"error":err.toString()
							});
						} else {
							response({
								"status":Type.Status["OK"],
								"value":value.toString()
							});
						}
					} catch (e) {
						journal.error(this, e.stack.toString());
					}					
				});				
			}
		} catch (e) {
			journal.error(this, e.stack.toString());
		}
	},

	"cwrite": function (node_uuid, data, response) {
		try {
			if (response) {
				this.instance.cwrite({"group":data.group, "channel":data.channel, "value":data.value}, function (err, value) {
					try {
						if (err) {
							response({
								"status":Type.Status["FAIL"],
								"error":err.toString()
							});
						} else {
							response({
								"status":Type.Status["OK"],
								"value":value.toString()
							});
						}
					} catch (e) {
						journal.error(this, e.stack.toString());
					}					
				});				
			}
		} catch (e) {
			journal.error(this, e.stack.toString());
		}		
	},

	"cpub": function (node_uuid, data) {
		try {
			this.instance.cpub({"group":data.group, "channel":data.channel, "value":data.value});			
		} catch (e) {
			journal.error(this, e.stack.toString());
		}		
	},

	"cupub": function (node_uuid, data) {
		try {
			this.instance.cupub({"group":data.group, "channel":data.channel});			
		} catch (e) {
			journal.error(this, e.stack.toString());
		}		
	}
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports.Collector = Collector;
