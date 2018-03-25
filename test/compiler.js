import path from 'path';
import webpack from 'webpack';
import memoryfs from 'memory-fs';

export default (entry, options) => {
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
				use: {
					loader: path.resolve(__dirname, '../src/fengari-loader.js'),
					options: options
				}
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
