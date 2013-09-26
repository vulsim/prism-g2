var Class = require("./class");
var Object = require("./object");

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var cluster = require('cluster');
var util = require('util');
var uuid = require('uuid');

var Rpc = require("../core/rpc").Rpc;
var Type = require("../core/types").Type;
var settings = require("../core/settings").settings;
var journal = require("../core/journal").journal;

var Core = Class.Inherit("Core", Object, function (name) {
	
	Class.Construct(this, name);
	
	return this;
});

Core.prototype.configure = function (settings) {

	var listen = settings.listen.split(":");
	this.settings = settings;	
	
	this.settings.address = listen[0];
	this.settings.port = listen[1];

	this.nodes = [];
};

Core.prototype.bind = function () {

	var that = this;

	try {
		this.rpc = new Rpc("rpc");
		this.rpc.listen(this.settings.uuid, util.format("tcp://%s:%d", this.settings.address, this.settings.port), function (node_uuid, method, data, response) {
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
		journal.information(this, util.format("Bind core at \"%s\" with UUID - %s", this.settings.listen, this.settings.uuid));
	} catch (e) {
		journal.error(this, "Core can't bind due to error(s): " + e.toString());
	}	
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Utilities

Core.prototype.getNodeByUUID = function (uuid, autocreate) {
	
	for (var index in this.nodes) {
		if (this.nodes[index].uuid == uuid) {
			return this.nodes[index]
		}
	}

	if (autocreate) {
		return this.createNodeWithUUID(uuid);
	}

	return undefined;
};

Core.prototype.createNodeWithUUID = function (uuid) {
	
	var node = {
		"uuid":uuid.toString(),
		"groups":[],
		"channels":[],
		"subscribe":{
			"groups":[],
			"channels":[]
		}
	};

	this.nodes.push(node);
	return node;	
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Handlers

Core.prototype.rpc_handler = {

	"nop": function(node_uuid, data, response) {		
		try {
			var node = this.getNodeByUUID(node_uuid, true);

			if (response) {
				response({
					"status":Type.Status["OK"]
				});
			}
		} catch (e) {
			journal.error(this, e.stack.toString());
		}		
	},

	"glist": function (node_uuid, data, response) {
		try {
			var node = this.getNodeByUUID(node_uuid, true);
			var groups = [];

			for (var index in this.nodes) {
				for (var gindex in this.nodes[index].groups) {
					var group = this.nodes[index].groups[gindex];
					
					if (groups.indexOf(group) < 0) {
						groups.push(group);
					}
				}
			}

			if (response) {
				response({
					"status":Type.Status["OK"],
					"groups":groups
				});
			}		
		} catch (e) {
			journal.error(this, e.stack.toString());
		}		
	}, 
	
	"gsub": function (node_uuid, data, response) {
		try {
			var node = this.getNodeByUUID(node_uuid, true);

			if (node.subscribe.groups.indexOf(data.group) < 0) {
				node.subscribe.groups.push(data.group);				
				if (response) {
					response({
						"status":Type.Status["OK"]
					});
				}
			} else {
				if (response) {
					response({
						"status":Type.Status["SKIP"]
					});
				}
			}
		} catch (e) {
			journal.error(this, e.stack.toString());
		}		
	},

	"gusub": function (node_uuid, data, response) {
		try {
			var node = this.getNodeByUUID(node_uuid, true);			
			var index = node.groups.channels.indexOf(data.group);

			if (index >= 0) {
				node.subscribe.groups.splice(index, 1);				

				if (response) {
					response({
						"status":Type.Status["OK"]
					});
				}
			} else {
				if (response) {
					response({
						"status":Type.Status["SKIP"]
					});
				}
			}
		} catch (e) {
			journal.error(this, e.stack.toString());
		}		
	},

	"clist": function (node_uuid, data, response) {
		try {
			var node = this.getNodeByUUID(node_uuid, true);
			var channels = [];

			for (var index in this.nodes) {				
				for (var cindex in this.nodes[index].channels) {
					var channel = this.nodes[index].channels[cindex];				
					if (channels.indexOf(channel) < 0) {
						channels.push(channel);
					}
				}									
			}

			if (response) {
				response({
					"status":Type.Status["OK"],
					"channels":channels
				});
			}		
		} catch (e) {
			journal.error(this, e.stack.toString());
		}		
	},

	"cread": function (node_uuid, data, response) {
		try {			
			var node = this.getNodeByUUID(node_uuid, true);			
			var channel = util.format("%s,%s", data.group, data.channel);

			for (var index in this.nodes) {
				if (this.nodes[index].channels.indexOf(channel) >= 0) {
					this.rpc.send(this.nodes[index].uuid, "cread", data, response);
					break;
				}
			}
		} catch (e) {
			journal.error(this, e.stack.toString());
		}		
	},

	"cwrite": function (node_uuid, data, response) {
		try {
			var node = this.getNodeByUUID(node_uuid, true);			
			var channel = util.format("%s,%s", data.group, data.channel);

			for (var index in this.nodes) {
				if (this.nodes[index].channels.indexOf(channel) >= 0) {
					this.rpc.send(this.nodes[index].uuid, "cwrite", data, response);
					break;
				}
			}
		} catch (e) {
			journal.error(this, e.stack.toString());
		}			
	},

	"cpub": function (node_uuid, data, response) {
		try {
			var node = this.getNodeByUUID(node_uuid, true);			
			var channel = util.format("%s,%s", data.group, data.channel);

			for (var index in this.nodes) {
				if (this.nodes[index].uuid != node_uuid && this.nodes[index].channels.indexOf(channel) >= 0) {
					if (response) {
						response({
							"status":Type.Status["FAIL"],
							"error":"Channels can't be overlapped"
						});
					}					
					return;
				}
			}

			if (node.channels.indexOf(channel) < 0) {
				node.channels.push(channel);

				if (node.groups.indexOf(data.group) < 0) {
					node.groups.push(data.group);
				}
			}

			for (var index in this.nodes) {
				if (this.nodes[index].uuid != node_uuid && ((this.nodes[index].subscribe.groups.indexOf(data.group) >= 0) || (this.nodes[index].subscribe.channels.indexOf(channel) >= 0))) {
					this.rpc.send(this.nodes[index].uuid, "cpub", data);
				}
			}

			if (response) {
				response({
					"status":Type.Status["OK"]
				});
			}
		} catch (e) {
			journal.error(this, e.stack.toString());
		}		
	},

	"csub": function (node_uuid, data, response) {
		try {
			var node = this.getNodeByUUID(node_uuid, true);
			var channel = util.format("%s,%s", data.group, data.channel);

			if (node.subscribe.channels.indexOf(channel) < 0) {
				node.subscribe.channels.push(channel);				

				if (response) {
					response({
						"status":Type.Status["OK"]
					});
				}
			} else {
				if (response) {
					response({
						"status":Type.Status["SKIP"]
					});
				}
			}
		} catch (e) {
			journal.error(this, e.stack.toString());
		}		
	},

	"cusub": function (node_uuid, data, response) {
		try {
			var node = this.getNodeByUUID(node_uuid, true);			
			var cindex = node.subscribe.channels.indexOf(util.format("%s,%s", data.group, data.channel));

			if (cindex >= 0) {
				node.subscribe.channels.splice(cindex, 1);				

				if (response) {
					response({
						"status":Type.Status["OK"]
					});
				}
			} else {
				if (response) {
					response({
						"status":Type.Status["SKIP"]
					});
				}
			}
		} catch (e) {
			journal.error(this, e.stack.toString());
		}
	}
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports.Core = Core;
module.exports.core = Core.default;


