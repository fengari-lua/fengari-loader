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
});
