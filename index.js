var _ = { // Selected Lodash functions
	isArray: require('lodash.isarray'),
	isPlainObject: require('lodash.isplainobject'),
	isObject: require('lodash.isobject'),
	isRegExp: require('lodash.isregexp'),
};

var options = {
	// PRE hooks:
	// Transform all the following methods via a function - each closure is called as (req, res, next)
	remapMethods: {},
	// Convert delete operations into an update by setting this to an object of the fields to change
	deleteUpdateRemap: false,

	// POST hooks:
	// Convert the fields specified by the key into the value (this will also override the removeFields matching)
	renameFields: {_id: '_id', __v: '_v'},
	// Array of RegExps or functions to run on each field in a return object to deside if it should be output
	removeFields: [/^_/],

	// Misc
	determineModel: function(req) { // Synchronous function that should determine the mongoose model we are working with from the request object - override this if you are using your own unique routing
		var extracted = /\/api\/(v1\/)?(.*)\/:id/.exec(req.route.path);
		if (extracted) return extracted[2];
	},
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
			if (options.renameFields[k]) {
				newObj[options.renameFields[k]] = obj[k];
				include = false;
			}

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

	// If deleteUpdateRemap is specified inject a function which turns delete operations into updates
	if (options['deleteUpdateRemap']) {
		options.remapMethods.delete = function(req, res, next) {
			if (!req.params.id) return next('Delete must have a single ID');
			if (typeof(req.params.id) != 'string') return next('Delete ID must be a single ID');
			var model = options.determineModel(req);
			if (!model) return next('Unable to deteremine model to work with');
			mongoose.connection.base.models[model].findByIdAndUpdate(req.params.id, {status: 'deleted'}, function(err, result) {
				if (err) return next(err);
				res.send(result);
			});
		};
	}

	return {
		preHook: function(req, res, next) {
			var method = req.method.toLowerCase();
			if (!options.remapMethods[method]) return next();
			options.remapMethods[method](req, res, next);
		},
		postHook: function(req, res, result) {
			if (result && result.result) { // >1 version of E-R-M
				res
					.status(result.statusCode)
					.send(walker(result.result))
					.end();
			} else { // <1 version of E-R-M (called as res,result)
				req.send(walker(res));
			}
		},
	};
};
