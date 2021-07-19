const { merge } = require('webpack-merge');
const nodeExternals = require('webpack-node-externals');
const common = require('./webpack.common.js');

module.exports = merge(common(), {
    target: 'web',
    output: {
        filename: 'index.browser.js',
        library: {
            type: "umd"
        }
    },
    externals: [
        nodeExternals({
            allowlist: ['axios']
        })
    ]
});