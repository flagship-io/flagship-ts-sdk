
 
const typescript = require('@rollup/plugin-typescript')
 
const resolve = require('@rollup/plugin-node-resolve')
 
const replace = require('@rollup/plugin-replace')
 
const terser = require('@rollup/plugin-terser')
 
const alias = require('@rollup/plugin-alias')

const isProduction = process.env.NODE_ENV === 'production'

module.exports = {
  input: 'src/index.ts',
  output: {
    dir: 'dist',
    entryFileNames: 'index.browser.esm.js',
    chunkFileNames: 'chunks/browser/esm/[hash].js',
    format: 'es',
    sourcemap: true
  },
  plugins: [
    alias({
      entries: [
        { find: '../visitor/VisitorProfileCache.node', replacement: '../visitor/VisitorProfileCache.browser' },
        { find: '../emotionAI/EmotionAI.node', replacement: '../emotionAI/EmotionAI.browser' },
        { find: 'http', replacement: false },
        { find: 'https', replacement: false },
        { find: 'node-fetch', replacement: false }
      ]
    }),
    replace({
      preventAssignment: true,
      values: {
        __fsWebpackIsReactNative__: JSON.stringify(false),
        __fsWebpackIsBrowser__: JSON.stringify(true),
        __fsWebpackIsNode__: JSON.stringify(false),
        __fsWebpackIsEdgeWorker__: JSON.stringify(false),
        __fsWebpackIsDeno__: JSON.stringify(false)
      }
    }),
    resolve({
      browser: true,
      preferBuiltins: false
    }),
    typescript({
      tsconfig: './tsconfig.json',
      sourceMap: true,
      compilerOptions: {
        noEmit: true,
        allowImportingTsExtensions: true
      }
    }),
    isProduction && terser({
      mangle: true,
      format: {
        comments: false
      }
    })
  ],
  external: ['events'],
  treeshake: {
    moduleSideEffects: false,
    propertyReadSideEffects: false,
    tryCatchDeoptimization: false
  }
}
