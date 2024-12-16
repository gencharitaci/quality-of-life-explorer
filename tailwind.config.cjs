const config = {
  content: ["*.html", "./src/**/*.{html,js,svelte,ts}"],

  theme: {
    extend: {
      colors: {
        'highlight': "#be185d"
      }, 
      keyframes: {
        "fade-in": {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
        "fade-out": {
          "0%": { opacity: 1 },
          "100%": { opacity: 0 },
        },
      },
      animation: {
        "fade-in": "fade-in 300ms ease-in-out",
        "fade-out": "fade-out 300ms ease-in-out",
      },
    }
  },

  plugins: [],
};

module.exports = config;
