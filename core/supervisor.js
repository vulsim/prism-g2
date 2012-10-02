
var spawn = require("child_process").spawn;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var SupervisorNode = function (index, options) {

	this.id = null;
	this.priority = "normal";

	try {
		this.id = options.id;
		this.priority = options.priority;		
	}
	catch (e) {

	}	

	return this;
};

SupervisorNode.prototype.start = function() {
	
};

SupervisorNode.prototype.stop = function() {
	
};

SupervisorNode.prototype.status = function() {
	
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var Supervisor = function () {

	this.settings = null;
	this.nodes = [];

	return this;
};

Supervisor.prototype.apply = function(settings) {
	
	this.settings = settings;

	try {
		
		for (index in settings.settings.core.nodes) {
			this.nodes[this.nodes.length] = new SupervisorNode(index + 1,settings.settings.core.nodes[index]);
		}
	}
	catch (e) {

	}
};

Supervisor.prototype.start = function(id, cb) {
		
};

Supervisor.prototype.stop = function(id, cb) {
		
};

module.exports = new Supervisor();

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////