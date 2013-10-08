var Class = require("../core/class");
var Object = require("../core/object");

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var zmq = require('zmq');
var util = require("util");

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var Handler = Class.Inherit("REQProvider", Object, function (name, core, journal, settings) {
	
	Class.Construct(this, name);

	this.core = core;
	this.journal = journal;
	this.settings = settings;

	return this;
});

Handler.prototype.initialize = function (done) {

	var that = this;

	this.socket = zmq.socket('rep');

	if (this.socket) {
		var listen = this.settings.listen.split(":");

		this.req.that = this;
		this.socket.identity = "REQ";
	  	this.socket.bind(util.format("tcp://%s:%d", listen[0], parseInt(listen[1])), function(err) {    
	    	if (err) {
	    		done(err);
	    	} else {
		    	that.socket.on('message', function (json) {
		    		try {
		    			var data = JSON.parse(json);

		    			if (data.req && that.req[data.req]) {
		    				that.req[data.req](data, function (err, rep) {
		    					try {
		    						if (err) {
			    						that.socket.send(JSON.stringify({
			    							"rep":data.req, 
			    							"error": err.toString()
			    						}));
			    					} else {
			    						that.socket.send(JSON.stringify(rep));
			    					}
		    					} catch (e) {
		    						that.journal.error(e.toString());
		    						that.socket.send(JSON.stringify({"error": "Internal server error"}));
		    					}
		    				});
		    			} else {
		    				that.socket.send(JSON.stringify({"error": "Malformed request"}));		    				
		    			}
		    		} catch (e) {
		    			that.journal.error(e.toString());
		    			that.socket.send(JSON.stringify({"error": "Internal server error"}));
		    		}
		    	});

		    	done();
	    	}
	    });
	} else {
		done(new Error("Server could not be initialized"));
	}
};

Handler.prototype.release = function () {

};

Handler.prototype.process = function () {

	var that = this;
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

Handler.prototype.cread = function (data, responce) {

};

Handler.prototype.cwrite = function (data, responce) {

};

Handler.prototype.cpub = function (data) {

};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

Handler.prototype.req = {

	"glist": function (data, cb) {

		var that = this.that;

		that.core.glist(function (err, groups) {
			if (err) {
				cb(new Error("Error occured when processed request"));
			} else {
				cb(null, {
					"rep": "glist",
					"groups": groups
				});
			}
		});
	},

	"clist": function (data, cb) {

		var that = this.that;

		that.core.clist(function (err, channels) {
			if (err) {
				cb(new Error("Error occured when processed request"));
			} else {
				var group = (data.group) ? data.group : null;
				var rep = {
					"rep": "clist",
					"channels": []
				};

				for (var index in channels) {
					var channel = channels[index].split(",");

					if (group) {
						if (group == channel[0]) {
							rep.channels.push({
								"group": channel[0],
								"channel": channel[1]
							});
						}
					} else {
						rep.channels.push({
							"group": channel[0],
							"channel": channel[1]
						});
					}
				}

				cb(null, rep);
			}
		});
	},

	"cread": function (data, cb) {

		var that = this.that;

		if (data.group && data.channel) {
			that.core.cread(data.group, data.channel, function (err, group, channel, value) {
				if (err) {
					cb(err);
				} else {
					cb(null, {
						"rep": "cread",
						"group": group,
						"channel": channel,
						"value": value
					});
				}
			});
		} else {
			cb(new Error("Malformed request"))
		}		
	},

	"cwrite": function (data, cb) {

		var that = this.that;

		if (data.group && data.channel && data.value) {
			that.core.cwrite(data.group, data.channel, data.value, function (err, group, channel, value) {
				if (err) {
					cb(err);
				} else {
					cb(null, {
						"rep": "cwrite",
						"group": group,
						"channel": channel,
						"value": value
					});
				}
			});
		} else {
			cb(new Error("Malformed request"))
		}
	}
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports = Handler;