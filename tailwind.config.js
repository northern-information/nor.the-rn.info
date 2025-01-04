/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.liquid'],
  theme: {
    fontFamily: {
      sans: [
        '-apple-system',
        'BlinkMacSystemFont',
        'Segoe UI',
        'Roboto',
        'Oxygen-Sans',
        'Ubuntu',
        'Cantarell',
        'Helvetica Neue',
        'sans-serif',
      ],
      mono: [
        'SFMono-Regular',
        'Menlo',
        'Monaco',
        'Consolas',
        'Liberation Mono',
        'Courier New',
        'monospace',
      ],
    },
    container: {
      center: true,
    },
    extend: {
      keyframes: {
        spectrumAnimation: {
          '0%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
          '100%': { 'background-position': '0% 50%' },
        },
      },
      animation: {
        spectrum: 'spectrumAnimation 48s linear infinite',
      },
      backgroundSize: {
        '600%': '600% 600%',
      },
    },
  },
  plugins: [],
}
