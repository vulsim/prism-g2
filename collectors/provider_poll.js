var Class = require("../core/class");
var Object = require("../core/object");

var CCore = require("../helpers/ccore").CCore;
var CJournal = require("../helpers/cjournal").CJournal;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var zmq = require('zmq');
var util = require("util");

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var Handler = Class.Inherit("REQProvider", Object, function (name, context, settings) {
	
	Class.Construct(this, name);

	this.context = context;
	this.settings = settings;
	
	this.core = new CCore("CCoreHelper", context);
	this.journal = new CJournal("CJournalHelper", context);

	return this;
});

Handler.prototype.initialize = function (done) {

	var that = this;

	this.socket = zmq.socket('rep');

	if (this.socket) {
		var listen = this.settings.listen.split(":");

		this.socket.identity = "POLL";
	  	this.socket.bind(util.format("tcp://%s:%d", listen[0], parseInt(listen[1])), function(err) {    
	    	if (err) {
	    		done(err);
	    	} else {
		    	that.socket.on('message', function (json) {
		    		try {
		    			var data = JSON.parse(json);
		    			var pollIterator = function (index, data, result, cb) {
		    				try {
		    					if (data[index]) {
		    						if (data[index].group && data[index].channel) {
		    							that.core.cread(data[index].group, data[index].channel, function (err, group, channel, value) {
											try {
												if (err == null) {
													result.push({
														"group": group, 
														"channel": channel, 
														"value":value
													});
												}												
												pollIterator(index + 1, data, result, cb);
											} catch (e) {
												cb(result);
											}
										});
		    						} else {		    							
		    							pollIterator(index + 1, data, result, cb);
		    						}		    						
		    					} else {
		    						cb(result);
		    					}
		    				} catch (e) {
		    					cb(result);
		    				}
		    			};
		    			pollIterator(0, data, [], function (result) {
		    				try {
		    					that.socket.send(JSON.stringify(result));
		    				} catch (e) {
		    					that.journal.error(e.toString());		    					
		    					that.socket.close();
		    				}
		    			});		    			
		    		} catch (e) {
		    			that.journal.error(e.toString());
		    			that.socket.send(JSON.stringify([]));
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

module.exports = Handler;