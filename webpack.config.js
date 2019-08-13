const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');
const serviceVersion = require("./package.json").version;

const DEV = !process.env.NODE_ENV || process.env.NODE_ENV !== 'prod';

module.exports = {
    entry: [
        'babel-polyfill', './src/main.js'
    ],
    output: {
        path: path.join(__dirname, `www/${process.env.TARGET}`),
        filename: '[name].bundle.js',
    },
    optimization: {
        minimize: DEV ? false : true,
        splitChunks: {
            chunks: "all",
            automaticNameDelimiter: "."
        }
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: [
                    'babel-loader',
                ],
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
            {from: `./manifest.${process.env.TARGET}.json`, to: `./manifest.json`},
            {from: './src/contentScripts', to: './contentScripts'},
            {from: './src/integrations', to: './integrations'},
            {from: './src/settings.html', to: './'},
            {from: './src/settings.js', to: './'}
        ]),
        new webpack.DefinePlugin({'serviceVersion': JSON.stringify(serviceVersion)})
    ]
};
