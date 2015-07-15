express-restify-mongoose-guard
==============================
Pre / post hooks for express-restify-mongoose that provides configurable protection for Restify interfaces.

This module works by attaching itself late in the load-order to [express-restify-mongoose](https://www.npmjs.com/package/express-restify-mongoose) and removing any potencially bad fields from the output.

This module was necessary as there was no method we could find that would omit certain fields without needing to list them all individually. Functionality grew over time to include other handy operations such as the `DELETE` to `UPDATE` rewriter.


Usage
-----

Include the module in the usual way and set it as the default `outputFn` when setting up express-restify-monogoose within your main `server.js` file:


	var restify = require('express-restify-mongoose');
	var restifyGuard = require('express-restify-mongoose-guard')();
	restify.defaults({
		version: '',
		middleware: restifyGuard.preHook,
		outputFn: restifyGuard.postHook,
	});


Configuration
-------------
By default express-restify-mongoose-guard will protect any field beginning with `_` from being outputted (except for `_id` and `__v` which is renamed to `_v`).

If you wish to tweak this further you can pass options by adding them to the function call.

The below shows some common patterns:


	var restify = require('express-restify-mongoose');
	var restifyGuard = require('express-restify-mongoose-guard')({

		// Rewrite all DELETE operations into an UPDATE forcing 'model.status = deleted'
		deleteUpdateRemap: {status: 'deleted'},

		removeFields: [

			// Remove all fields beginning with '_'
			/^_/, 

			// Remove all fields beginning with '$'
			/^\$/,

			// Run the fields though a filter and remove anything where the value is 'FIXME'
			function (val, key) {
				return (val == 'FIXME');
			},
		],

	});

	restify.defaults({
		version: '',
		middleware: restifyGuard.preHook,
		outputFn: restifyGuard.postHook,
	});


| Option              | Type                          | Default                       | Description    |
|---------------------|-------------------------------|-------------------------------|----------------|
| `deleteUpdateRemap` | Object                        | `false`                       | If specified all `DELETE` operations are rewritten as update operations and the object is saved. This allows you to override deletes with something like `{status: 'deleted'}` as a flag instead of actually removing the document |
| `remapMethods`      | Object (method => middleware) | `{}`                          | Middleware handler for specific HTTP methods. Each function is called as `function(req, res, next)` in the usual Express style |
| `removeFields`      | Array of RegExps / Functions  | `[/^_/]`                      | A list of regular expressions or closure functions to run on each object field. Returning true will omit that field from the output |
| `renameFields`      | Object (field => renamed)     | `{'_id': '_id', '__v': '_v'}` | An object of fields to rename. This also takes presidence over `removeFields` so any rename here will override the remove |
