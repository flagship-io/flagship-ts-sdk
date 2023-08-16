const peerDepsExternal = require('rollup-plugin-peer-deps-external')
const nodeResolve = require('@rollup/plugin-node-resolve')
const commonjs = require('@rollup/plugin-commonjs')
const typescript = require('@rollup/plugin-typescript')
const autoprefixer = require('autoprefixer')
const postcss = require('rollup-plugin-postcss')
const pk = require('./package.json')
const { terser } = require('rollup-plugin-terser')

const extensions = ['.js', '.jsx', '.ts', '.tsx']
const globals = {
  react: 'React',
  'react-dom': 'ReactDOM'
}

module.exports = [
  {
    input: ['./src/index.ts'],
    output: [
      {
        file: pk.module,
        format: 'esm',
        globals
      },
      {
        file: pk.main,
        format: 'cjs',
        globals
      }

    ],
    plugins: [
      peerDepsExternal({ includeDependencies: true }),
      nodeResolve({ extensions, browser: true }),
      commonjs(),
      typescript(),
      postcss({
        plugins: [autoprefixer()],
        sourceMap: true,
        extract: false,
        minimize: true
      })
    // terser()
    ]
  },
  {
    input: ['./src/index.ts'],
    output: [
      {
        file: pk.browser,
        format: 'umd',
        name: 'fsQaModule',
        globals
      }
    ],

    plugins: [
      // peerDepsExternal({ includeDependencies: true }),
      nodeResolve({ browser: true }),
      commonjs(),
      typescript()
      // postcss({
      //   plugins: [autoprefixer()],
      //   sourceMap: true,
      //   extract: false,
      //   minimize: true
      // })
    // terser()
    ]
  }]
