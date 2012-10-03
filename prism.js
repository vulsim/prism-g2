//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Boot up 

require("./modules/min/string.format-1.0.js");

require("./core/namespace").base("com.prism.2");

require("./core/object").prototype.namespace = require("./core/namespace").using("core");

require("./core/settings").settings.load();

require("./core/journal").journal.configure(require("./core/settings").settings.core.journal);

require("./core/supervisor").supervisor.configure(require("./core/settings").settings.core.process);

require("./core/supervisor").supervisor.start();

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////


