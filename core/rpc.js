var Class = require("./class");
var Object = require("./object");

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var zmq = require('zmq');
var util = require("util");
var uuid = require('uuid'); 

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var Rpc = Class.Inherit("Rpc", Object, function (name) {	

	Class.Construct(this, name);
	
	this.isMaster = false;
	this.uuid = uuid.v1();	
	
	return this;
});

Rpc.prototype.listen = function (node_uuid, address, handler) {

	var that = this;	

	this.requests = [];	
	this.uuid = node_uuid;	
	this.isMaster = true;
	this.socket = zmq.socket('router');
	this.socket.identity = node_uuid;
  	this.socket.bind(address, function(err) {    
    	if (err) {
    		throw err;
    	}

    	that.socket.on('message', function (node_uuid, json) {    		    		
			var packet = JSON.parse(json);
    		if (packet.qmark) {
    			var smark = packet.qmark;    			
    			handler(node_uuid, packet.method, packet.data, function (data) {
    				try {
    					that.socket.send([node_uuid, JSON.stringify({
	    					"method":packet.method,
	    					"data":data,
	    					"smark":smark
	    				})]);
    				} catch (e) {

    				}	    				
    			});
    		} else if (packet.smark) {
    			for (index in that.requests) {
    				if (that.requests[index].mark == packet.smark) {
    					var request = that.requests[index];
    					that.requests.splice(index, 1);
    					Function.call.apply(request.handler, [].concat(request.context, packet.data)); 
    					break;
    				}
    			}
    		} else {
    			handler(node_uuid, packet.method, packet.data);
    		}    		
    	});
    });

    return this;
};

Rpc.prototype.link = function (node_uuid, address, handler) {
	
	var that = this;

	this.requests = [];
	this.nodes = {};

	var node = {
		"uuid": node_uuid,
		"socket": zmq.socket('dealer')
	};

	node.socket.identity = this.uuid;
	node.socket.on('message', function(json) {		    	
		var packet = JSON.parse(json);
		if (packet.qmark) {
			var smark = packet.qmark;    			
			handler(node_uuid, packet.method, packet.data, function (data) {
				try {
					node.socket.send([JSON.stringify({
    					"method":packet.method,
    					"data":data,
    					"smark":smark
    				})]);
				} catch (e) {

				}	    				
			});
		} else if (packet.smark) {
			for (index in that.requests) {
				if (that.requests[index].mark == packet.smark) {
					var request = that.requests[index];
					that.requests.splice(index, 1);
					Function.call.apply(request.handler, [].concat(request.context, packet.data)); 
					break;
				}
			}
		} else {
			handler(node_uuid, packet.method, packet.data);
		}    		
	});
	node.socket.connect(address);

	this.nodes[node_uuid] = node;	
	return node;
};

Rpc.prototype.send = function (node_uuid, method, data, response, timeout, context) {

	if (this.isMaster) {		
		if (typeof(response) != undefined) {			
			var qmark = uuid.v4();
			this.requests.push({
				"mark":qmark,
				"handler":response,
				"context":(typeof(context) != undefined) ? context : this,
				"ttl":(typeof(timeout) != undefined) ? timeout : 60,
			});
			this.socket.send([node_uuid, JSON.stringify({
				"method":method,
		    	"data":data,
		    	"qmark":qmark
			})]);
		} else {
			this.socket.send([node_uuid, JSON.stringify({
				"method":method,
		    	"data":data
			})]);
		}
	} else {
		var node = this.nodes[node_uuid];
		if (node) {
			if (typeof(response) != undefined) {
				var qmark = uuid.v4();
				this.requests.push({
					"mark":qmark,
					"handler":response,
					"context":(typeof(context) != undefined) ? context : this,
					"ttl":(typeof(timeout) != undefined) ? timeout : 60,
				});
				node.socket.send([JSON.stringify({
					"method":method,
			    	"data":data,
			    	"qmark":qmark
				})]);
			} else {
				node.socket.send([JSON.stringify({
					"method":method,
			    	"data":data
				})]);
			}
		}
	}
}; 

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports.Rpc = Rpc;