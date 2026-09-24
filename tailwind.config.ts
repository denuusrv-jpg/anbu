import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Warmes Gold – Akzentfarbe für die Marke allgemein
        gold: {
          DEFAULT: "#F2A65A",
          light: "#F7C08A",
        },
        // Für den Dating-Modus
        rose: {
          DEFAULT: "#E85D75",
        },
        // Für den Freunde-Modus
        teal: {
          DEFAULT: "#4FD1C5",
        },
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
