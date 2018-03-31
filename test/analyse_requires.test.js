import { lua, lauxlib, to_luastring } from 'fengari';
import { analyse_requires } from '../src/analyse_requires.js';

const strip = function(source) {
	if (typeof source === 'string')
		source = to_luastring(source);
	const L = lauxlib.luaL_newstate();
	if (lauxlib.luaL_loadbuffer(L, source, null, null) === lua.LUA_ERRSYNTAX) {
		let msg = lua.lua_tojsstring(L, -1);
		throw new SyntaxError(msg);
	}
	const writer = function(L, b, size, B) {
		lauxlib.luaL_addlstring(B, b, size);
		return 0;
	};
	let b = new lauxlib.luaL_Buffer();
	lauxlib.luaL_buffinit(L, b);
	if (lua.lua_dump(L, writer, b, true) !== 0)
		throw new Error('unable to dump given function');
	lauxlib.luaL_pushresult(b);
	source = new Uint8Array(lua.lua_tostring(L, -1));
	lua.lua_pop(L, 1);
	return source;
};

describe('Analysis of lua require calls', () => {
	test('basic call', () => {
		expect(analyse_requires(`require "foo"`)).toEqual(['foo']);
	});
	test('with dotted module', () => {
		expect(analyse_requires(`require "foo.bar"`)).toEqual(['foo.bar']);
	});
	test('with global assignment', () => {
		expect(analyse_requires(`foo = require "foo"`)).toEqual(['foo']);
	});
	test('with local assignment', () => {
		expect(analyse_requires(`local foo = require "foo"`)).toEqual(['foo']);
	});
	test('with conditional require', () => {
		expect(analyse_requires(`if somecond() then require "foo" end`)).toEqual(['foo']);
	});
	test('with tail call', () => {
		expect(analyse_requires(`return require "foo"`)).toEqual(['foo']);
	});
	test('with many requires', () => {
		expect(analyse_requires(`
local foo = require "foo"
local bar = require "foo.bar"
require "static"
function more()
	require "morethings"
end
return require "otherthing"
		`).sort()).toEqual(['foo', 'foo.bar', 'static', 'morethings', 'otherthing'].sort());
	});
	test('with stripped code', () => {
		expect(analyse_requires(strip(`require "foo"`))).toEqual(['foo']);
	});
	test('detects invalid arguments', () => {
		expect(() => {
			analyse_requires({});
		}).toThrow(TypeError);
	});
	test('detects invalid syntax', () => {
		expect(() => {
			analyse_requires(`1#2`);
		}).toThrow(SyntaxError);
	});
});
