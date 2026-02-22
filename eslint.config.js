import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import stylistic from "@stylistic/eslint-plugin";

export default [
    {
        files: ["**/*.ts"],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                project: "./tsconfig.base.json",
                sourceType: "module"
            }
        },
        plugins: {
            "@typescript-eslint": tseslint,
            "@stylistic": stylistic
        },
        rules: {
            /* stylistic */
            "@stylistic/indent": ["error", 4],
            "@stylistic/semi": ["error", "always"],
            "@stylistic/quotes": ["error", "double", { "avoidEscape": true }],
            "@stylistic/comma-dangle": ["error", "never"],
            "@stylistic/object-curly-spacing": ["error", "always"],

            /* typescript */
            "@typescript-eslint/consistent-type-imports": ["error"],
            "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
            "@typescript-eslint/no-explicit-any": "off",

            /* base */
            "no-console": "off"
        }
    }
];