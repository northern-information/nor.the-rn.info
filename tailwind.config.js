/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.liquid', './src/index.liquid'],
  safelist: ['md:border-r-4'],
  theme: {
    fontFamily: {
      mono: [
        'SFMono-Regular',
        'Menlo',
        'Monaco',
        'Consolas',
        'Liberation Mono',
        'Courier New',
        'monospace',
      ],
      olde: [
        'GoudyTextMTStd',
        'Iowan Old Style',
        'Palatino Linotype',
        'URW Palladio L',
        'P052',
        'serif',
      ],
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
      serif: [
        'Charter',
        'Bitstream Charter',
        'Sitka Text',
        'Times New Roman',
        'serif',
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
      backgroundImage: {
        powerlines: `url('/images/000558300025.jpg')`,
        foxfires: `url('/images/foxfires-kybalion.png')`,
        'red-robin': `url('/images/IMG_3876.jpg')`,
        'four-oh-four': `url('/images/crown-via-phill-c-on-yelp.jpg')`,
        'caution-stripes':
          'repeating-linear-gradient(45deg, #fde047 0px, #fde047 10px, black 10px, black 20px)',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
