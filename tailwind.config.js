/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            colors: {
                "brand-light": "#F5EFE6", // Light brown
                "brand-medium": "#E8DFCA", // Medium light brown
                "brand-dark": "#785A3E", // Dark brown
                "brand-darker": "#4B3F30", // Even darker brown
                "brand-accent": "#A08C6D", // Accent brown
            },
            fontFamily: {
                sans: ["Inter", "sans-serif"], // Example font
            },
        },
    },
    plugins: [require("@tailwindcss/typography")], // For markdown styling
};
