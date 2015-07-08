express-restify-mongoose-guard
==============================
Pre-output handler for express-restify-mongoose that removes certain fields from the output object.

This module works by attaching itself late in the load-order to [express-restify-mongoose](https://www.npmjs.com/package/express-restify-mongoose) and removing any potencially bad fields from the output.

This module was necessary as there was no method we could find that would omit certain fields without needing to list them all individually.


Usage
-----

Include the module in the usual way and set it as the default `outputFn` when setting up express-restify-monogoose within your main `server.js` file:


	var restify = require('express-restify-mongoose');
	restify.defaults({
		version: '',
		outputFn: require('express-restify-mongoose-guard')(),
	});


Configuration
-------------
By default express-restify-mongoose-guard will protect any field beginning with `_` from being outputted.

If you wish to tweak this further you can pass options by adding them to the function call.

The below shows some common patterns:


	global.restify = require('express-restify-mongoose');
	restify.defaults({
		version: '',
		outputFn: require('express-restify-mongoose-guard')({
			removeFields: [

				// Remove all fields beginning with '_'
				/^_/, 

				// Remove all fields beginning with '$'
				/^\$/,

				// Run the fields though a filter and remove anything where the value is 'FIXME'
				function (val, key) {
					return (val == 'FIXME');
				},
			]
		}),
	});


| Option             | Type                         | Default                       | Description    |
|--------------------|------------------------------|-------------------------------|----------------|
| `removeFields`     | Array of RegExps / Functions | `[/^_/]`                      | A list of regular expressions or closure functions to run on each object field. Returning true will omit that field from the output |
| `renameFields`     | Object (field => renamed)    | `{'_id': '_id', '__v': '_v'}` | An object of fields to rename. This also takes presidence over `removeFields` so any rename here will override the remove |
