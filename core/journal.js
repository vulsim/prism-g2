var Class = require("./class");
var Object = require("./object");

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var globalSettings = require("./settings").settings;
var util = require("util");

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var Journal = Class.Inherit("Journal", Object, function (name) {
	
	Class.Construct(this, name);

	this.handlers = [];	
	
	return this;
});

Journal.prototype.configure = function (settings) {

	try {
		for (index in settings) {			
			var HandlerClass = require(globalSettings.resolve(settings[index].use, globalSettings.path.use));

			if (HandlerClass) {
				var handler = new HandlerClass();

				if (handler) {
					handler.namespace = this.namespace + ".journal";

					if (handler.configure) {
						handler.configure(settings[index].configure);
					}

					this.handlers[this.handlers.length] = { handler : handler, verbosity : (settings[index].verbosity) ? settings[index].verbosity : "3" };
				}
			}			
		}
	}
	catch (e) {
		this.error(this, e.toString());
	}

	return this;
};

Journal.prototype.format = function (sender, message) {

	var formattedMessage;

	if (sender) {
		formattedMessage = util.format("[%s %s.%s::%s]\t%s", (new Date()).toISOString(), (sender.namespace) ? sender.namespace : "undefined", (sender.className) ? sender.className : "undefined", (sender.name) ? sender.name : "undefined", message);
	} else {
		formattedMessage = util.format("[%s]\t%s", (new Date()).toISOString(), message);
	}

	return formattedMessage;
};

Journal.prototype.needLog = function (priority, verbosity) {

	return (10 - priority <= verbosity) ? true : false;
};

Journal.prototype.information = function (sender, message, priority) {
	
	if (priority == undefined) {
		priority = 3;
	}

	if (this.handlers.length > 0) {
		for (index in this.handlers) {
			if (this.handlers[index].handler.information && this.needLog(priority, this.handlers[index].verbosity)) {
				this.handlers[index].handler.information(this.format(sender, message));
			}
		}	
	} else {
		console.log("INFO\t" + this.format(sender, message)); 
	}
};

Journal.prototype.warning = function (sender, message, priority) {

	if (priority == undefined) {
		priority = 3;
	}

	if (this.handlers.length > 0) {
		for (index in this.handlers) {
			if (this.handlers[index].handler.warning && this.needLog(priority, this.handlers[index].verbosity)) {			
				this.handlers[index].handler.warning(this.format(sender, message));
			}
		}
	} else {
		console.log("WARN\t" + this.format(sender, message)); 
	}
};

Journal.prototype.error = function (sender, message, priority) {

	if (priority == undefined) {
		priority = 3;
	}

	if (this.handlers.length > 0) {
		for (index in this.handlers) {
			if (this.handlers[index].handler.error && this.needLog(priority, this.handlers[index].verbosity)) {
				this.handlers[index].handler.error(this.format(sender, message));
			}
		}
	} else {
		console.log("ERROR\t" + this.format(sender, message)); 
	}
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports.Journal = Journal;
module.exports.journal = Journal.default;