const {
	to_jsstring,
	to_luastring,
	lua: {
		LUA_ERRSYNTAX,
		lua_tojsstring,
		lua_topointer
	},
	lauxlib: {
		luaL_loadbuffer,
		luaL_newstate
	}
} = require('fengari');

/* We need some fengari internals */
let fengariPath = require.resolve('fengari');
fengariPath = fengariPath.substr(0, fengariPath.lastIndexOf('/'));
const {
	constant_types: {
		LUA_TBOOLEAN,
		LUA_TLNGSTR,
		LUA_TNIL,
		LUA_TNUMFLT,
		LUA_TNUMINT,
		LUA_TSHRSTR
	}
} = require(`${fengariPath}/defs.js`);
const {
	INDEXK,
	ISK,
	OpCodesI: {
		OP_CALL,
		OP_GETTABUP,
		OP_LOADK
	}
} = require(`${fengariPath}/lopcodes.js`);

const toproto = function(L, i) {
	return lua_topointer(L, i).p;
};

const UPVALNAME = function(f, x) {
	return f.upvalues[x].name ? to_jsstring(f.upvalues[x].name.getstr()) : '-';
};

const readconstant = function(f, i) {
	let o = f.k[i];
	switch (o.ttype()) {
		case LUA_TNIL:
			return void 0;
		case LUA_TBOOLEAN:
		case LUA_TNUMFLT:
		case LUA_TNUMINT:
			return o.value;
		case LUA_TSHRSTR:
		case LUA_TLNGSTR:
			return to_jsstring(o.svalue());
		default:
			throw Error('unhandled constant type');
	}
};

const isRequire = function(f, pc) {
	let i = f.code[pc];
	return i.opcode === OP_GETTABUP &&
		ISK(i.C) &&
		UPVALNAME(f, i.B) == '_ENV' &&
		readconstant(f, INDEXK(i.C)) == 'require';
};

const FindRequires = function(f, requires) {
	for (let pc = 0; pc < f.code.length; pc++) {
		if (isRequire(f, pc)) {
			/* Found someone using require */
			if (f.code[pc+1].opcode === OP_LOADK &&
				f.code[pc+2].opcode === OP_CALL) {
				let arg = readconstant(f, INDEXK(f.code[pc+1].Bx));
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
		source = to_luastring(source);
	else if (!Array.isArray(source))
		throw TypeError('expected string or array of bytes');
	const L = luaL_newstate();
	if (luaL_loadbuffer(L, source, null, null) === LUA_ERRSYNTAX) {
		let msg = lua_tojsstring(L, -1);
		throw new SyntaxError(msg);
	}
	const f = toproto(L, -1);
	return FindRequires(f, []);
};

module.exports = {
	analyse_requires: analyse_requires
};
