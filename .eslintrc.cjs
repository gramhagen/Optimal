module.exports = {
  root: true,
  overrides: [
    {
      files: ["**/*.html"],
      parser: "@html-eslint/parser",
      plugins: ["@html-eslint"],
      extends: ["plugin:@html-eslint/recommended"],
    },
  ],
};
