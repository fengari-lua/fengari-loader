/* We need some fengari internals */
let fengariPath = require.resolve('fengari');
fengariPath = fengariPath.substr(0, fengariPath.lastIndexOf('/'));

const lua      = require(`${fengariPath}/lua.js`);
const CT       = require(`${fengariPath}/defs.js`).CT;
const lauxlib  = require(`${fengariPath}/lauxlib.js`);
const lopcodes = require(`${fengariPath}/lopcodes.js`);
const ops      = lopcodes.OpCodesI;

const toproto = function(L, i) {
	return lua.lua_topointer(L, i).p;
};

const UPVALNAME = function(f, x) {
	return f.upvalues[x].name ? lua.to_jsstring(f.upvalues[x].name.getstr()) : '-';
};

const readconstant = function(f, i) {
	let o = f.k[i];
	switch (o.ttype()) {
		case CT.LUA_TNIL:
			return void 0;
		case CT.LUA_TBOOLEAN:
		case CT.LUA_TNUMFLT:
		case CT.LUA_TNUMINT:
			return o.value;
		case CT.LUA_TSHRSTR:
		case CT.LUA_TLNGSTR:
			return lua.to_jsstring(o.svalue());
		default:
			throw Error('unhandled constant type');
	}
};

const isRequire = function(f, pc) {
	let i = f.code[pc];
	return i.opcode === ops.OP_GETTABUP &&
		lopcodes.ISK(i.C) &&
		UPVALNAME(f, i.B) == '_ENV' &&
		readconstant(f, lopcodes.INDEXK(i.C)) == 'require';
};

const FindRequires = function(f, requires) {
	for (let pc = 0; pc < f.code.length; pc++) {
		if (isRequire(f, pc)) {
			/* Found someone using require */
			if (f.code[pc+1].opcode === ops.OP_LOADK &&
				f.code[pc+2].opcode === ops.OP_CALL) {
				let arg = readconstant(f, lopcodes.INDEXK(f.code[pc+1].Bx));
				if (typeof arg !== 'string')
					throw new TypeError('passed non-string to require');
				requires.push(arg);
			} else {
				throw new Error('unable to analyse require usage');
			}
		}
	}
	let n = f.p.length;
	for (let i = 0; i < n; i++)
		FindRequires(f.p[i], requires);
	return requires;
};

const analyse_requires = function(source) {
	if (typeof source == 'string')
		source = lua.to_luastring(source);
	else if (!Array.isArray(source))
		throw TypeError('expected string or array of bytes');
	const L = lauxlib.luaL_newstate();
	if (lauxlib.luaL_loadbuffer(L, source, null, null) === lua.LUA_ERRSYNTAX) {
		let msg = lua.lua_tojsstring(L, -1);
		throw new SyntaxError(msg);
	}
	const f = toproto(L, -1);
	return FindRequires(f, []);
};

module.exports = {
	analyse_requires: analyse_requires
};
