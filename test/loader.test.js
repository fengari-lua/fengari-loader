import compiler from './compiler.js';

describe('Inserts code and outputs JavaScript', () => {
	test('simple example', async () => {
		const stats = await compiler('./example.lua', {});
		const output = stats.toJson().modules[0].source;
		expect(output).toBe(
			'var fengari_web = require("fengari-web");\n' +
			'module.exports = fengari_web.load("local foo = \\"bar\\"\\nreturn {\\n\\tfoo = foo;\\n}\\n", "@"+"./example.lua").call("./example.lua");'
		);
	});

	test('Inserts code and outputs JavaScript', async () => {
		const stats = await compiler('./example.lua', { strip: true });
		const output = stats.toJson().modules[0].source;
		expect(output).toBe(
			'var fengari_web = require("fengari-web");\n' +
			'module.exports = fengari_web.load(fengari_web.luastring_of(27,76,117,97,83,0,25,147,13,10,26,10,4,4,4,4,8,120,86,0,0,0,0,0,0,0,40,119,64,1,0,0,0,0,0,0,0,0,0,0,1,2,5,0,0,0,1,0,0,0,75,64,0,0,74,0,128,128,102,0,0,1,38,0,128,0,2,0,0,0,20,4,98,97,114,20,4,102,111,111,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0), "@"+"./example.lua").call("./example.lua");'
		);
	});
});
