var _ = { // Selected Lodash functions
	isArray: require('lodash.isarray'),
	isPlainObject: require('lodash.isplainobject'),
	isObject: require('lodash.isobject'),
	isRegExp: require('lodash.isregexp'),
};

var options = {
	// Array of RegExps or functions to run on each field in a return object to deside if it should be output
	removeFields: [/^_/],
};

/**
* Walker function to iterate though the collection / array / object tree
* @param mixed obj The object to iterate over
* @return Either the incomming object or the rewritten object without any bad fields
*/
var walker = function(obj) {
	if (_.isArray(obj)) {
		for (var i = 0; i < obj.length; i++) {
			obj[i] = walker(obj[i]);
		}
	} else if (_.isPlainObject(obj)) {
		var newObj = {};
		for (var k in obj) {
			if (!obj.hasOwnProperty(k)) continue;
			var include = true;
			for (var rf in options.removeFields) {
				if (_.isRegExp(options.removeFields[rf])) {
					if (options.removeFields[rf].test(k)) include = false;
				} else { // Assume its a function
					if (options.removeFields[rf].test(obj[k], k)) include = false;
				}
				if (!include) break;
			}

			if (include) newObj[k] = walker(obj[k]);
		}
		obj = newObj;
	} else if (_.isObject(obj)) {
		return obj.toString();
	}
	return obj;
};

module.exports = function(userSettings) {
	// Adopt user setting overrides if any {{{
	if (userSettings)
		for (var k in userSettings)
			options[k] = userSettings[k];
	// }}}

	return function(res, result) {
		res.send(walker(result));
	};
};
