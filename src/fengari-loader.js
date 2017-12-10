'use strict';

const getOptions = require('loader-utils').getOptions;
const validateOptions = require('schema-utils');

const analyse_requires = require('./analyse_requires.js').analyse_requires;

const schema = {
	type: 'object',
	properties: {
		dependencies: {
			type: 'object',
			patternProperties: {
				'.*': { type: 'string' }
			}
		}
	}
};

exports.default = function(source) {
	const options = getOptions(this) || {};
	validateOptions(schema, options, 'Fengari Loader');

	let s = 'var fengari_web = require("fengari-web");\n';
	let lua_dependencies = options.dependencies;
	let lua_dependencies_keys;
	if (lua_dependencies === void 0) {
		lua_dependencies = {};
		lua_dependencies_keys = analyse_requires(source);
		for (let i=0; i<lua_dependencies_keys.length; i++) {
			let lua_name = lua_dependencies_keys[i];
			/* if lua requires "foo" then look for webpack dependency "foo" */
			lua_dependencies[lua_name] = lua_name;
		}
	} else {
		lua_dependencies_keys = Object.keys(lua_dependencies);
	}
	if (lua_dependencies_keys.length > 0) {
		s +=
			'var lua = fengari_web.lua;\n' +
			'var lauxlib = fengari_web.lauxlib;\n' +
			'var L = fengari_web.L;\n' +
			'var push = fengari_web.interop.push;\n' +
			'lauxlib.luaL_getsubtable(L, lua.LUA_REGISTRYINDEX, lauxlib.LUA_PRELOAD_TABLE);\n';
		for (let i=0; i<lua_dependencies_keys.length; i++) {
			let lua_name = lua_dependencies_keys[i];
			let require_path = lua_dependencies[lua_name];
			this.addDependency(require_path);
			s +=
				'lua.lua_pushcfunction(L, function(L){push(L, require(' + JSON.stringify(require_path) +')); return 1;});\n' +
				'lua.lua_setfield(L, -2, lua.to_luastring(' + JSON.stringify(lua_name) + '));\n';
		}
		s += 'lua.lua_pop(L, 1);\n';
	}
	let chunkname = '@' + this.resourcePath;
	return s + 'module.exports = fengari_web.load(' + JSON.stringify(source) + ', ' + JSON.stringify(chunkname) + ')' +
		/* call with require string */
		'.call(' + JSON.stringify(this.resource) + ');';
};
