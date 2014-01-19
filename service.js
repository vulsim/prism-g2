var Service = require('node-windows').Service;

var service = new Service({
  "name": "Prism G2 Service",
  "description": 'Distributed control system designed for flexible automated process',
  "script": require("path").join(__dirname, "prism.js")
});

service.on('install', function() {
	console.log('Starting service...');
	service.start();	
});

service.install();
