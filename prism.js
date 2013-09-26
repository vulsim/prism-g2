var cluster = require('cluster');
var util = require('util');
var uuid = require('uuid'); 

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Boot up 

require("./core/object").prototype.namespace = "com.prism";

var settings = require("./core/settings").settings;
settings.load();

var journal = require("./core/journal").journal;
journal.configure(settings.journal);

if (cluster.isMaster) {

	journal.information(null, "Boot up \"Prism\"...");
	
	var core = require("./core/core").core;
	core.configure(settings.core);
	core.bind();

	var nodes = {};

	for (var index in settings.collector) {
		
		var collector = {
			"uuid": uuid.v1(),
			"handler": settings.collector[index].handler,
			"configure": settings.collector[index].configure
		};
		
		if (collector) {
			if (nodes[settings.collector[index].group] == undefined) {
				nodes[settings.collector[index].group] = {
					"collectors": []
				};
			}
			nodes[settings.collector[index].group].collectors.push(collector);
		}
	}


	var info_map = "\n=== Collectors map ===\n";

	for (var node in nodes) {
		
		nodes[node].worker = cluster.fork();
		nodes[node].worker.send(JSON.stringify({
			"master_uuid":core.settings.uuid,
			"master_address":util.format("tcp://127.0.0.1:%d",core.settings.port),
			"collectors":nodes[node].collectors
		}));

		info_map += util.format(">>> PID:%d [%s]\n", nodes[node].worker.process.pid, node);

		for (var index in nodes[node].collectors) {
			info_map += util.format("\t\\- %s [%s]\n",  nodes[node].collectors[index].uuid, nodes[node].collectors[index].handler);
		}
	}

	journal.information(null, info_map);
		
	cluster.on('exit', function(worker, code, signal) {
		
		journal.error(null, util.format("Worker with PID:%d was down. Code: %d", worker.process.pid, code), 0);
		
		/*setTimeout(function () {
			cluster.fork();
		}, 2000);*/
	});

} else {
	var node_collectors = {};

	process.on('message', function(data) {
    	
    	journal.information(null, util.format("Starting worker with PID:%d...", process.pid));

    	var Collector = require("./core/collector").Collector;
    	var settings = JSON.parse(data);    	
    	
    	try {
	    	for (var index in settings.collectors) {	    		
	    		var collector = (new Collector(settings.collectors[index].uuid)).configure({
	    			"uuid": settings.master_uuid,
	    			"address": settings.master_address,
	    		}, settings.collectors[index].handler, settings.collectors[index].configure);
	    		
	    		if (collector) {	    				    	
	    			node_collectors[settings.collectors[index].uuid] = collector;
	    			collector.start();
	    		} else {
	    			journal.error(null, util.format("Can't initialize collector [UUID: %s, Handler: %s]", settings.collectors[index].uuid, settings.collectors[index].handler), 0);
	    		}
	    	}
    	} catch(e) {
    		journal.error(null, e.stack.toString(), 0);
    	}
  	});
	
	process.on('uncaughtException',function (e) {
   		journal.error(null, e.stack.toString(), 0);
	});	
}

