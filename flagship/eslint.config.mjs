import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default defineConfig([
  // Global ignores
  globalIgnores(['**/dist', '**/dist-deno', '**/coverage', '**/node_modules', '**/src/depsDeno.ts']),

  js.configs.recommended,
  ...tseslint.configs.recommended,
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