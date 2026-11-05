/** Config de Tailwind para compilar las clases de v0 a un CSS LOCAL (sin CDN).
 *  Reproduce los tokens del archivo de v0 (rgb var para claro/oscuro).
 *  Uso:
 *    npx tailwindcss@3.4.17 -c build/tailwind.config.js -i build/tailwind-input.css -o app/styles.css --minify
 *  (el 'content' apunta a donde vive el markup con las clases: index.html + app.js)
 */
module.exports = {
  darkMode: 'class',
  content: ['./app/index.html', './app/app.js'],
  theme: {
    extend: {
      colors: {
        paper:    'rgb(var(--paper) / <alpha-value>)',
        paper2:   'rgb(var(--paper-2) / <alpha-value>)',
        ink:      'rgb(var(--ink) / <alpha-value>)',
        clay:     'rgb(var(--clay) / <alpha-value>)',
        claydeep: 'rgb(var(--clay-deep) / <alpha-value>)',
        jade:     'rgb(var(--jade) / <alpha-value>)',
        ochre:    'rgb(var(--ochre) / <alpha-value>)',
      },
      fontFamily: {
        serif: ['"Iowan Old Style"', 'Fraunces', 'Georgia', 'serif'],
        sans:  ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
};
