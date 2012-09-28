

var Collector = function (core) {

	if (core) {	

		this.core = core;		
		return this;
	}	

	return null;
};


//////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Handler module code swaping

Collector.prototype.handlerStop = function (hotswap) {

	var cachedModule = require.resolve("../handlers/" + this.handler.name);
 	var result = null;

 	if (cachedModule) { 		
 		
 		if (hotswap) { 			
 			if (cachedModule.exports.hotswap)
 				result = cachedModule.exports.hotswap(); 			
 		} else { 			 			
 			if (cachedModule.exports.stop)
 				cachedModule.exports.stop();
 		}
 		
 		delete require.cache[cachedModule]; 		
 	}

 	return result;
};

Collector.prototype.handlerColdstart = function () {

	this.handlerStop(false);
 	this.handler.module = new require("../handlers/" + this.handler.name)(this.settings.configure);

 	if (this.handler.module) {
 		
 		if (this.handler.module.coldstart) 		
 			this.handler.module.coldstart();

 		return true;
 	}
 	
 	return false;
};

Collector.prototype.handlerHotswap = function () {

	if (this.handler.module && this.handler.module.hotswap && this.handler.module.hotstart) {

 		var memdump = this.handlerStop(true);
 		this.handler.module = new require("../handlers/" + this.handler.name)(this.settings.configure);

 		if (this.handler.module) { 		 				
 			
 			this.handler.module.hotstart(memdump);
 			return true;
 		} 			 		 		
 	}

 	return false;
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

Collector.prototype.registerChannel = function (channel, cb) {

};

Collector.prototype.unregisterChannel = function (channel, cb) {

};

Collector.prototype.registerAllChannels = function (channels, cb) {

};

Collector.prototype.unregisterAllChannels = function (channels, cb) {

};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

Collector.prototype.Load = function (settings, cb) {

};

Collector.prototype.Unload = function (cb) {
 	
};

Collector.prototype.Reload = function (settings, cb) {
 	
};

Collector.prototype.Hotswap = function (settings, cb) {
 	
};

exports.Collector = Collector;