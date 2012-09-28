
var fs = require("fs");
var path = require("path");

var Settings = function () {

	this.settings = {

	};
	
	return this;
};

Settings.prototype.load = function (relativePath, settingsPath) {

	var newSettings = JSON.parse(fs.readFileSync(path.resolve(relativePath, settingsPath),'utf8'));
	
	if (newSettings) {
		
		this.settings = newSettings;
		this.path = path.resolve(relativePath, settingsPath);
		
		return true;
	}

	return false;
};

Settings.prototype.reload = function () {

	if (this.path) {

		var newSettings = null;
		
		try {			
			newSettings = JSON.parse(fs.readFileSync(this.path,'utf8'));		
		}
		catch (e) {
		}
		finally {

			if (newSettings) {
				this.settings = newSettings;
				return true;
			}
		}
	}

	return false;
};

module.exports = new Settings();