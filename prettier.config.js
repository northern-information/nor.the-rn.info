/**
 * @see https://prettier.io/docs/en/configuration.html
 * @type {import("prettier").Config}
 */
const config = {
  trailingComma: 'es5',
  tabWidth: 2,
  semi: false,
  singleQuote: true,
  plugins: ['prettier-plugin-tailwindcss'],
  overrides: [
    {
      files: ['*.html', '*.md', '*.njk'],
      options: {
        singleQuote: false,
      },
    },
  ],
}

export default config
