/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#101018",
        mist: "#f2f4f8",
        ember: "#ff6b4a",
        lagoon: "#3bd6b7",
        dusk: "#2a2e47"
      },
      fontFamily: {
        display: ["Space Grotesk", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"]
      },
      boxShadow: {
        glow: "0 20px 50px rgba(255, 107, 74, 0.25)",
        soft: "0 12px 40px rgba(15, 20, 38, 0.18)"
      }
    }
  },
  plugins: []
};
