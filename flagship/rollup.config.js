import typescript from '@rollup/plugin-typescript'
import alias from '@rollup/plugin-alias'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import nodePolyfills from 'rollup-plugin-polyfill-node'
import babel from '@rollup/plugin-babel'
import { resolve } from 'path'
import commonjs from '@rollup/plugin-commonjs'

const extensions = ['.js', '.jsx', '.ts', '.tsx', '.d.ts']

export default [
  // {
  //   input: 'src/index.ts',
  //   output: [
  //     {
  //       file: 'dist/index.js',
  //       format: 'esm'
  //     }
  //   ],
  //   external: ['events', 'node-fetch', 'node-abort-controller'],
  //   plugins: [
  //     commonjs(),
  //     nodeResolve({
  //       preferBuiltins: true,
  //       extensions
  //     }),
  //     typescript()
  //   ]
  // },
  // {
  //   input: 'src/index.ts',
  //   output: [
  //     {
  //       file: 'dist/index.native.js',
  //       format: 'esm'
  //     }
  //   ],
  //   external: ['events'],
  //   plugins: [
  //     commonjs(),
  //     alias({
  //       entries: [
  //         {
  //           find: '../depsNode',
  //           replacement: '../depsNode.native'
  //         }
  //       ]
  //     }),
  //     nodeResolve({
  //       preferBuiltins: false,
  //       extensions
  //     }),
  //     typescript()
  //   ]
  // },
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/index.cjs',
        format: 'cjs'
      }],
    external: ['events', 'node-fetch', 'node-abort-controller', /core-js/],
    plugins: [
      commonjs(),
      nodeResolve({
        preferBuiltins: true,
        extensions
      }),
      typescript(),
      // nodePolyfills(),
      babel({
        babelHelpers: 'runtime',
        extensions,
        presets: [
          ['@babel/preset-env',
            {
              targets: { node: 6 },
              modules: false,
              useBuiltIns: 'usage',
              corejs: 3,
              debug: true
            }
          ],
          '@babel/preset-typescript'
        ],
        plugins: [
          ['@babel/plugin-transform-runtime']
        ]
      })
    ]
  }
  // {
  //   input: 'src/index.ts',
  //   output: [
  //     {
  //       file: 'dist/index.browser.js',
  //       format: 'iife',
  //       name: 'Flagship'
  //     }],
  //   plugins: [
  //     alias({
  //       entries: [
  //         {
  //           find: '../depsNodeEsm',
  //           replacement: '../depsBrowser'
  //         }
  //       ]
  //     }),
  //     commonjs(),
  //     nodeResolve({
  //       browser: true,
  //       preferBuiltins: false,
  //       dedupe: ['events'],
  //       extensions
  //     }),
  //     typescript(),
  //     babel({
  //       babelHelpers: 'runtime',
  //       extensions,
  //       presets: [
  //         ['@babel/preset-env',
  //           {
  //             targets: {
  //               browsers: [
  //                 '> 0.5%, last 2 versions, ie >= 10'
  //               ]
  //             },
  //             debug: true,
  //             useBuiltIns: 'usage',
  //             corejs: 3
  //           }
  //         ],
  //         '@babel/preset-typescript'
  //       ],
  //       plugins: [
  //         ['@babel/plugin-transform-runtime']
  //       ]
  //     })
  //     // nodePolyfills(),

  //   ]
  // },

]
