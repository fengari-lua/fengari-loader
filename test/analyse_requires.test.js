import { analyse_requires } from '../src/analyse_requires.js';

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
