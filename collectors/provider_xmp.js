var Class = require("../core/class");
var Object = require("../core/object");

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var util = require("util");
var net = require('net');
var libxmljs = require('libxmljs');

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var XmpProviderHandler = Class.Inherit("XmpProviderHandler", Object, function (name, core, journal, settings) {
	
	Class.Construct(this, name);

	this.core = core;
	this.journal = journal;
	this.settings = settings;

	return this;
});

XmpProviderHandler.prototype.initialize = function (done) {

	var that = this;

	this.server = net.createServer(function(socket) {
		socket.frame = null;
		socket.group = null;
	  	socket.transact = false;

	  	socket.on('connect', function() {
	  		socket.write("<bracket><info>Exstation XML 0.5 Lite</info></bracket>");
	  	});

		socket.on('end', function() {
	    
	  	});

	  	socket.on('data', function(data) {
	  		try {	  			
	  			if (socket.transact) {	  				
	  				return;
	  			}

	  			socket.frame += data.toString();
	  			
		  		var beginIndex = socket.frame.indexOf("<bracket>");
		  		var endIndex = socket.frame.indexOf("</bracket>") + ("</bracket>").length;

		  		if (beginIndex >= 0 && endIndex > 0) {
		  			socket.transact = true;

		  			var packet = socket.frame.substring(beginIndex, endIndex);		  			
		  			var xmpIn = libxmljs.parseXmlString(packet);
		  			var xmpOut = libxmljs.Document();

		  			socket.frame = null;

		  			var transactEstimateCount = 0;
		  			var transactProcessedCount = 0;

		  			var xmpOutRootElement = libxmljs.Element(xmpOut, "bracket");		  					  		
		  			xmpOut.root(xmpOutRootElement);
		  			
		  			if (xmpIn.get('service')) {
		  				var xmpOutServiceElement = xmpOutRootElement.node("service");
			  			for (var index in xmpIn.get('service').childNodes()) {		  				
			  				var cmd = xmpIn.get('service').childNodes()[index];
			  				if (cmd.name() == "do") {		  				
			  					transactEstimateCount++;
			  					var response = xmpOutServiceElement.node("rdo");
			  					try {
			  						var role = cmd.attr("role").value();
				  					if (that.settings.access_groups[role] && that.settings.access_groups[role].cword == cmd.text()) {
				  						socket.group = that.settings.access_groups[role].group;
				  						response.attr({"status": "granted"});
				  						transactProcessedCount++;
				  					} else {
				  						response.attr({"status": "deny"});
				  						transactProcessedCount++
				  					}
			  					} catch (e) {
			  						that.journal.error(e.stack.toString());
			  						response.attr({"status": "fail"});
			  						transactProcessedCount++
			  					}	  							  					
			  				}
			  			}
		  			}

		  			if (xmpIn.get('data')) {
		  				var xmpOutDataElement = xmpOutRootElement.node("data");
			  			for (var index in xmpIn.get('data').childNodes()) {		  				
			  				var cmd = xmpIn.get('data').childNodes()[index];
			  				if (cmd.name() == "list") {		  				
			  					transactEstimateCount++;			  					
			  					try {
			  						if (socket.group) {
			  							that.core.clist(function (err, channels) {
			  								try {
			  									var response = xmpOutDataElement.node("list");
			  									if (err == null) {
				  									for (var index in channels) {
				  										var channel = channels[index].split(",");
				  										if (channel[0] == socket.group) {
				  											response.node("channel").attr({"ch": channel[1], "type": "s"});
				  										}
				  									}
				  									response.attr({"status": "processed"});
				  								} else {
				  									response.attr({"status": "fail"});
				  								}
			  								} catch (e) {
			  									var response = xmpOutDataElement.node("list");
			  									response.attr({"status": "fail"});
			  								}			  								
			  								transactProcessedCount++;
			  							});
			  						} else {
			  							var response = xmpOutDataElement.node("list");
			  							response.attr({"status": "deny"});
			  							transactProcessedCount++
			  						}
			  					} catch (e) {
			  						that.journal.error(e.stack.toString());
			  						var response = xmpOutDataElement.node("list");
			  						response.attr({"status": "fail"});
			  						transactProcessedCount++
			  					}	  							  					
			  				} else if (cmd.name() == "read") {
			  					transactEstimateCount++;
			  					try {
			  						if (socket.group) {
			  							that.core.cread(socket.group, cmd.attr("ch").value(), function (err, group, channel, value) {			  								
			  								try {
			  									var response = xmpOutDataElement.node("read");
			  									if (err == null) {
			  										response.text(value);
				  									response.attr({"ch": channel, "status": "processed"});
				  								} else {
				  									response.attr({"ch": channel, "status": "fail"});
				  								}
			  								} catch (e) {
			  									response.attr({"ch": channel, "status": "fail"});
			  								}			  								
			  								transactProcessedCount++;
			  							});
			  						} else {
			  							var response = xmpOutDataElement.node("read");
			  							response.attr({"ch": cmd.attr("ch").value(), "status": "deny"});
			  							transactProcessedCount++
			  						}
			  					} catch (e) {
			  						that.journal.error(e.stack.toString());
			  						var response = xmpOutDataElement.node("read");
			  						response.attr({"ch": cmd.attr("ch").value(), "status": "fail"});
			  						transactProcessedCount++
			  					}
			  				}
			  			}
		  			}
		  			
		  			console.log(packet);
			  		var transactInteraval = setInterval(function() {
			  			if (transactEstimateCount == transactProcessedCount) {
			  				clearInterval(transactInteraval);
			  				socket.write(xmpOut.toString());
			  				console.log(xmpOut.toString());
			  				socket.transact = false;
			  			}
					}, 100);

		  		}
	  		} catch (e) {
	  			that.journal.error(e.stack.toString());
				socket.frame = null;
				socket.transact = false;
	  		}
	  	});
	});

	if (this.server) {
		var listen = this.settings.listen.split(":");

		this.server.listen(parseInt(listen[1]), listen[0], function() {
			done();		  
		});
	} else {
		done(new Error("Server could not be initialized"));
	}	
};

XmpProviderHandler.prototype.release = function () {

};

XmpProviderHandler.prototype.process = function () {

	var that = this;

};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

XmpProviderHandler.prototype.cread = function (data, responce) {

	responce(null, this.groups[data.group][data.channel]++);
};

XmpProviderHandler.prototype.cwrite = function (data, responce) {
	responce(null, 125);
};

XmpProviderHandler.prototype.cpub = function (data) {

};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports = XmpProviderHandler;
