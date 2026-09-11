import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  ...nextCoreWebVitals,
  {
    rules: {
      "react/no-unescaped-entities": "off",
      "@next/next/no-page-custom-font": "off",
      // Most of the UI is still .jsx, which tsc does not type-check (checkJs
      // would surface ~30 implicit-any errors before it surfaced a real one).
      // Lint is what actually catches dead imports and bindings across both
      // .jsx and .tsx, so it's the gate rather than the typechecker.
      "no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", ignoreRestSiblings: true },
      ],
    },
  },
  {
    // The base rule doesn't understand TS syntax and flags parameter names in
    // interface/type signatures as unused bindings. The typescript-eslint
    // version understands them, so TS files use that one instead.
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", ignoreRestSiblings: true },
      ],
    },
  },
];

export default eslintConfig;
