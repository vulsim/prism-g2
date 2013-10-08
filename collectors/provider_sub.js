var Class = require("../core/class");
var Object = require("../core/object");

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var zmq = require('zmq');
var util = require("util");

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var Handler = Class.Inherit("SUBProvider", Object, function (name, core, journal, settings) {
	
	Class.Construct(this, name);

	this.core = core;
	this.journal = journal;
	this.settings = settings;

	return this;
});

Handler.prototype.initialize = function (done) {

	var that = this;

	this.socket = zmq.socket('pub');

	if (this.socket) {
		var listen = this.settings.listen.split(":");

		this.socket.identity = "SUB";
	  	this.socket.bind(util.format("tcp://%s:%d", listen[0], parseInt(listen[1])), function(err) {    
	    	if (err) {
	    		done(err);
	    	} else {		    	
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

	if (this.settings.subscribe) {
		if (this.settings.subscribe.groups) {
			var gsubIterator = function (index, callback) {
				try {					
					if (that.settings.subscribe.groups[index] != undefined) {
						try {
							that.core.gsub(that.settings.subscribe.groups[index], function () {
								gsubIterator(index + 1, callback);
							});
						} catch (e) {
							gsubIterator(index + 1, callback);
						}						
					} else {
						callback();
					}
				} catch (e) {
					callback();
				}
			};
			gsubIterator(0, function () {

			});
		}

		if (this.settings.subscribe.channels) {
			var csubIterator = function (index, callback) {
				try {
					if (that.settings.subscribe.channels[index] != undefined) {
						try {
							var channel = that.settings.subscribe.channels[index].split(",");
							that.core.csub(channel[0], channel[1], function () {
								csubIterator(index + 1, callback);
							});
						} catch (e) {
							csubIterator(index + 1, callback);
						}						
					} else {
						callback();
					}
				} catch (e) {
					callback();
				}
			};
			csubIterator(0, function () {
				
			});
		}
	}
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

Handler.prototype.cread = function (data, responce) {

};

Handler.prototype.cwrite = function (data, responce) {

};

Handler.prototype.cpub = function (data) {

	var that = this;

	try {
		var json = JSON.stringify(data);
		this.socket.send(util.format("%s,%s pub %s", data.group.toString(), data.channel.toString(), json));
		this.socket.send(util.format("%s pub %s", data.group.toString(), json));
	} catch (e) {
		this.journal.error(e.toString());
	}
};

Handler.prototype.cupub = function (data) {

	var that = this;

	try {
		var json = JSON.stringify(data);
		this.socket.send(util.format("%s,%s upub %s", data.group.toString(), data.channel.toString(), json));
		this.socket.send(util.format("%s upub %s", data.group.toString(), json));
	} catch (e) {
		this.journal.error(e.toString());
	}
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports = Handler;