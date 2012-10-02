
var domain = "com";

module.exports.base = function (newdomain) {

	domain = newdomain;
	return domain;
};

module.exports.using = function (namespace) {

	return domain + "." + namespace;
};
