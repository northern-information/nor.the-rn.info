/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.liquid'],
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
        'red-robin': "url('/rm_ation/images/IMG_3876.jpg')",
        'four-oh-four': "url('/rm_ation/images/crown-via-phill-c-on-yelp.jpg')",
      },
    },
  },
  plugins: [],
}
