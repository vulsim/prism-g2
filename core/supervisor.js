var Class = require("./class");
var Object = require("./object");

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var child_process = require("child_process");
var util = require("util");
var journal = require("./journal").journal;
var gloabalSettings = require("./settings").settings;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var Process = Class.Inherit("Process", Object, function (name) {

	Class.Construct(this, name);

	this.state = 0;	
	this.process = null;
	this.retryCount = 0;
	this.watchdog = null;
	this.heartbeat = 0;
	
	this.id = null;
	this.priority = "normal";
	this.failRetryCount = 6;
	this.failRetryDelay = 10000;
	this.watchdogTimeout = 30000;

	return this;
});

Process.prototype.configure = function(settings) {

	try {

		for (var property in settings)
   			this[property] = settings[property];
   					
		this.name = settings.id;		
		this.state = 1;
	}
	catch (e) {
		journal.error(this, 0, "An exception occurred when trying to configure");
	}

	return this;
};

Process.prototype.start = function() {
	
	local = this;

	if (this.state == 1) {

		this.state = 2;
		this.heartbeat = 0;
		this.retryCount++;

		if (this.watchdog)			
			clearInterval(this.watchdog);
				
		this.process = child_process.fork(gloabalSettings.resolve("./process.js", gloabalSettings.path.core));

		this.watchdog = setInterval(function () {

			if (local.process) {
				
				if (local.heartbeat == 0) {
					
					journal.error(local, 0, "Heartbeat not detected. Process will be killed");				
					local.stop();					

				} else {
					local.heartbeat = 0;
				}

			} else {

				if (local.watchdog)			
					clearInterval(local.watchdog);	
			}

		}, this.watchdogTimeout);

		this.process.on('exit', function(code, signal) {

			local.process = null;

			if (local.state == 2) {
				
				if (code != 0) {

					journal.error(local, 0, util.format("Process was down due to errors with (%s) times", local.retryCount));

					if (local.retryCount < local.failRetryCount) {

						setTimeout(function () {

							journal.information(local, 0, "Restarting process...");
							local.state = 1;
							local.start();

						}, local.failRetryDelay);

					} else {
					
						journal.warning(local, 0, "Accepted process attempts to restart. Switch to 'stopped' state");						
						local.stop();
					}

				} else {
								
					journal.information(local, 0, "Process has finished");					
					local.stop();
				}			
			}
		});
		
		this.process.on("message", function(message, object) {

			if (message === "started") {

				local.retryCount = 0;
				journal.information(local, 0, "Process started successfully");
			}			
		});

	} else {
		journal.warning(this, 0, "Skip start because process not configured");
	}	
};

Process.prototype.stop = function() {
	
	if (this.state > 1) {

		if (this.watchdog)					
			clearInterval(this.watchdog);		

		if (this.process) {

			this.process.kill("SIGKILL");
			this.process = null;			
			journal.information(this, 0, "Process was killed");
		} else {
			this.retryCount = 0;
			this.state = 1;
		}	

	} else {
		journal.warning(this, 0, "Skip stop because process not started");
	}	
};

Process.prototype.status = function() {
	
	switch (this.state) {
		case 0:
			return "empty";
		case 1:
			return "stopped";
		case 2:
			return "started";
		default:
			return "unknown";
	}	
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var Supervisor = Class.Inherit("Supervisor", Object, function (name) {

	Class.Construct(this, name);

	this.settings = null;
	this.processes = [];

	return this;
});

Supervisor.prototype.configure = function(settings) {
	
	try {

		this.settings = settings;
		
		for (index in settings) {

			if (settings[index].id) {
				
				var process = new Process("N_" + settings[index].id);

				if (process) {

					this.processes[this.processes.length] = process;
					process.namespace = this.namespace + ".supervisor";									
					process.configure(settings[index]);
				}
						
			} else {
				journal.warning(this, 0, util.format("Process %j cannot be loaded", settings[index]));
			}
		}
	}
	catch (e) {		
		journal.error(this, 0, "An exception occurred when trying to configure");
	}
};

Supervisor.prototype.start = function(id) {

	if (id) {

	} else {

		for (index in this.processes) {

			try {
				this.processes[index].start();
			} 
			catch (e) {
				journal.error(this, 0, util.format("An exception occurred when trying to start process %j", this.processes[index]));
			}
		}
	}

	return this;		
};

Supervisor.prototype.stop = function(id) {

	if (id) {

	} else {

	}

	return this;
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports.Supervisor = Supervisor;
module.exports.supervisor = Supervisor.default;

