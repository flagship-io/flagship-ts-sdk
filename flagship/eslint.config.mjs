import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import js from "@eslint/js";
import tseslint from "typescript-eslint";

import eslintPluginFormatting from 'eslint-plugin-format';


export default defineConfig([
  // Global ignores
  globalIgnores(['**/dist', '**/dist-deno', '**/coverage', '**/node_modules', '**/src/depsDeno.ts', '**/src/sdkVersion.ts']),

  js.configs.recommended,
  ...tseslint.configs.recommended,

  { plugins: { format: eslintPluginFormatting } },
  
  // TypeScript files (*.ts) - Custom rules
  {
    files: ["**/*.ts"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        project: ["./tsconfig.json"]
      }
    },
    rules: {
      // Error Prevention
      "no-console": "error",
      "no-debugger": "error",
      "no-alert": "error",

      // Best Practices
      "quotes": ["error", "single", { "avoidEscape": true }],
      "complexity": ["error", 15],
      "max-depth": ["error", 3],
      "max-params": ["error", 4],
      "no-duplicate-imports": "error",
      "key-spacing": ["error", { "beforeColon": false, "afterColon": true }],
      "object-curly-spacing": ["error", "always"],
      "object-curly-newline": ["error", {
        "ObjectExpression": { "multiline": true, "minProperties": 2 },
        "ObjectPattern": { "multiline": true },
        "ImportDeclaration": "never",
        "ExportDeclaration": { "multiline": true, "minProperties": 3 }
      }],
      "object-property-newline": ["error", { "allowAllPropertiesOnSameLine": false }],
      "object-shorthand": ["error", "always", {
        "avoidQuotes": true,
        "ignoreConstructors": false,
        "avoidExplicitReturnArrows": true
      }],
      
      // Indentation and spacing
      "indent": ["error", 2, { "SwitchCase": 1 }],
      "no-trailing-spaces": "error",
      "semi": ["error", "always"],
      "semi-spacing": ["error", { "before": false, "after": true }],
      "space-before-blocks": "error",
      "space-before-function-paren": ["error", {
        "anonymous": "always",
        "named": "never",
        "asyncArrow": "always"
      }],
      "space-in-parens": ["error", "never"],
      "space-infix-ops": "error",
      
      // Line breaks
      "comma-dangle": ["error", "never"],
      "brace-style": ["error", "1tbs", { "allowSingleLine": false }],
      "eol-last": ["error", "always"],

      // SDK-specific concerns
      "no-restricted-globals": "error",
      "prefer-const": "error",
      "no-var": "error",

      // TypeScript specific
      "@typescript-eslint/explicit-function-return-type": ["error", {
        "allowExpressions": true,  
        "allowTypedFunctionExpressions": true,  
        "allowHigherOrderFunctions": true, 
        "allowDirectConstAssertionInArrowFunctions": true,
        "allowConciseArrowFunctionExpressionsStartingWithVoid": true
      }],
      "@typescript-eslint/no-explicit-any": ["warn", {
        "ignoreRestArgs": false,
        "fixToUnknown": false
      }],
      "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
      "@typescript-eslint/no-non-null-assertion": "warn",
      "@typescript-eslint/ban-ts-comment": "warn"
    }
  },
  {
    files: ["**/*.cjs"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "commonjs"
      }
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off"
    }
  },
  {
    files: ["**/*.{js,mjs}"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module"
      }
    },
    rules: {
      "no-console": "error",
      "no-debugger": "error",
      "no-alert": "error",
      "complexity": ["error", 15],
      "max-depth": ["error", 3],
      "max-params": ["error", 4],
      "no-duplicate-imports": "error",
      "no-restricted-globals": "error",
      "prefer-const": "error",
      "no-var": "error",
    }
  },
  {
    files: ["**/test/**/*.ts", "**/*.test.ts"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        project: ["./tsconfig.test.json"]
      }
    },
    rules: {
      "max-lines": "off",
      "complexity": "off",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-explicit-any": "off"
    }
  }
]);