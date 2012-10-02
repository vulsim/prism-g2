//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Boot up 

require("./modules/min/string.format-1.0.js");

require("./core/namespace").base("com.prism.2");

require("./core/object").prototype.namespace = require("./core/namespace").using("core");

require("./core/settings").settings.load();

require("./core/journal").journal.configure(require("./core/settings").settings.core.journal);

require("./core/journal").journal.information(require("./core/settings").settings, 1, "Boot up done");

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//var supervisor = require("./core/supervisor");
//supervisor.apply(settings);
//supervisor.startAll();	

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////


