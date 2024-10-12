const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');
const webpack = require('webpack');

let DEV =
	!process.env.NODE_ENV ||
	process.env.NODE_ENV !== 'prod' ||
	process.env.TARGET === 'www/chrome';
let targetForManifest =
	process.env.TARGET === 'www/chrome' ? 'chrome' : process.env.TARGET;

module.exports = {
	mode: DEV ? 'development' : 'production',
	devtool: DEV ? 'source-map' : 'nosources-cheap-module-source-map',
	entry: './src/main.js',
	output: {
		path: path.join(__dirname, `${process.env.TARGET}`),
		filename: '[name].bundle.js',
		publicPath: '',
	},
	optimization: {
		minimize: DEV ? false : true,
		splitChunks: {
			cacheGroups: {
				defaultVendors: {
					test: /[\\/]node_modules[\\/]/,
					name: 'vendors',
					chunks: 'all',
					automaticNameDelimiter: '.',
				},
			},
		},
	},
	module: {
		rules: [
			{
				test: /\.(js|jsx)$/,
				exclude: /node_modules/,
				use: {
					loader: 'babel-loader',
					options: {
						presets: ['@babel/preset-env', '@babel/preset-react'],
					},
				},
			},
			{
				test: /\.(ts|tsx)$/,
				exclude: /node_modules/,
				use: {
					loader: 'babel-loader',
					options: {
						presets: ['@babel/preset-env', '@babel/preset-react', '@babel/preset-typescript'],
					},
				},
			},
			{
				test: /\.s[ac]ss$/i,
				use: [
					// Creates `style` nodes from JS strings
					'style-loader',
					// Translates CSS into CommonJS
					'css-loader',
					// Compiles Sass to CSS
					'sass-loader',
				],
			},
			{
				test: /\.css$/i,
				use: ['style-loader', 'css-loader'],
			},
			{
				test: /\.(png|svg|jpe?g|gif)$/,
				include: /images/,
				use: [
					{
						loader: 'file-loader',
						options: {
							name: '[name].[ext]',
							outputPath: 'assets/images',
							publicPath: 'assets/images',
						},
					},
				],
			},
			{
				test: /\.(woff(2)?)(\?v=\d+\.\d+\.\d+)?$/,
				use: [
					{
						loader: 'file-loader',
						options: {
							name: '[name].[ext]',
							outputPath: 'fonts/',
						},
					},
				],
			},
		],
	},
	resolve: {
		modules: [path.join(__dirname, 'node_modules')],
		alias: {
			'~': path.resolve(__dirname, 'src')
		}
	},
	plugins: [
		new webpack.ProvidePlugin({
			// Make a global `process` variable that points to the `process` package,
			// because the `util` package expects there to be a global variable named `process`.
			// Thanks to https://stackoverflow.com/a/65018686/14239942
			process: 'process/browser',
		}),
		new NodePolyfillPlugin(),
		new CopyWebpackPlugin({
			patterns: [
				{ from: './assets', to: './assets' },
				{ from: './styles', to: './styles' },
				{ from: `./index.html`, to: './' },
				{ from: `./manifest.${targetForManifest}.json`, to: `./manifest.json` },
				{ from: './src/contentScripts', to: './contentScripts' },
				{ from: './src/api-services', to: './api-services' },
				{ from: './src/integrations', to: './integrations' },
				{ from: './src/popupDlg', to: './popupDlg' },
				{ from: './src/settings.html', to: './' },
				{ from: './src/settings.js', to: './' },
				{ from: './_locales', to: './_locales' },
				{
					from: './src/helpers/locales.js',
					to: './contentScripts/clockifyLocales.js',
					transform(content) {
						return content
							.toString()
							.replace('const locales', 'self.clockifyLocales')
							.replace('return locales;', '')
							.replace('export default', '');
					},
				},
				{ from: './node_modules/moment/moment.js', to: './' },
				{ from: './sw.js', to: './' },
			],
		}),
	],
};
