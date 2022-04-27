const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');

let DEV = !process.env.NODE_ENV || process.env.NODE_ENV !== 'prod' || process.env.TARGET === 'www/chrome';
let targetForManifest =
    process.env.TARGET === 'www/chrome' ? 'chrome' : process.env.TARGET;

module.exports = {
    mode: 'production',
    devtool: 'nosources-cheap-module-source-map',
    entry: [
        '@babel/polyfill', './src/main.js'
    ],
    output: {
        path: path.join(__dirname, `${process.env.TARGET}`),
        filename: '[name].bundle.js',
    },
    optimization: {
        minimize: DEV ? false : true,
        splitChunks: {
            chunks: 'all',
            automaticNameDelimiter: '.',
        }
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env', '@babel/preset-react']
                      }
                },
            },
        ],
    },
    resolve: {
        modules: [
            path.join(__dirname, 'node_modules'),
        ],
    },
    plugins: [
        new webpack.EnvironmentPlugin({
            NODE_ENV: 'local'
        }),
        new CopyWebpackPlugin([
            {from: './assets', to: './assets'},
            {from: './styles', to: './styles'},
            {from: `./index.html`, to: './'},
            {from: `./manifest.${targetForManifest}.json`, to: `./manifest.json`},
            {from: './src/contentScripts', to: './contentScripts'},
            {from: './src/integrations', to: './integrations'},
            {from: './src/popupDlg', to: './popupDlg'},
            {from: './src/settings.html', to: './'},
            {from: './src/settings.js', to: './'},
            {from: './_locales', to: './_locales'},
            {from: './src/helpers/locales.js',  to: './contentScripts/clockifyLocales.js',
                transform(content) {
                    return content
                        .toString()
                        .replace('var locales', 'var clockifyLocales')
                        .replace('export default locales;', "");
                },
            },
            {from: './sw.js', to: './'}
        ])
    ]
};
