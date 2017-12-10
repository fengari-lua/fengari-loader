import path from 'path';
import webpack from 'webpack';
import memoryfs from 'memory-fs';

export default (entry) => {
	const compiler = webpack({
		context: __dirname,
		entry: entry,
		output: {
			path: path.resolve(__dirname),
			filename: 'bundle.js',
		},
		module: {
			rules: [{
				test: /\.lua$/,
				use: path.resolve(__dirname, '../src/fengari-loader.js')
			}]
		}
	});

	compiler.outputFileSystem = new memoryfs();

	return new Promise((resolve, reject) => {
		compiler.run((err, stats) => {
			if (err) reject(err);

			resolve(stats);
		});
	});
};
