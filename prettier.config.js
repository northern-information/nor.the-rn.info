/**
 * @see https://prettier.io/docs/en/configuration.html
 * @type {import("prettier").Config}
 */
const config = {
  trailingComma: 'es5',
  tabWidth: 2,
  semi: false,
  singleQuote: true,
  plugins: ['@shopify/prettier-plugin-liquid', 'prettier-plugin-tailwindcss'],
  overrides: [
    {
      files: ['*.liquid'],
      options: {
        singleQuote: false,
        parser: 'liquid-html',
      },
    },
    {
      files: ['*.html', '*.md'],
      options: {
        singleQuote: false,
      },
    },
  ],
}

export default config
