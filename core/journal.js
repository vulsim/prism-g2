var Class = require("./class");
var Object = require("./object");

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var settings = require("./settings").settings;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var Journal = Class.Inherit("Journal", Object, function (name) {
	
	Class.Construct(this, name);

	this.handlers = [];	
	
	return this;
});

Journal.prototype.configure = function () {

	try {
		
		for (index in settings.settings.core.journal) {

			console.log(settings.settings.core.journal[index]);
		}
	}
	catch (e) {
		this.error("Can't load configuration");
	}

};

Journal.prototype.information = function(type, message) {
	
};

Journal.prototype.warning = function(type, message) {

};

Journal.prototype.error = function(type, message) {

};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports.Journal = Journal;
module.exports.journal = Journal.default;