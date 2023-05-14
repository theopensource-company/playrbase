/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './pages/**/*.{js,ts,jsx,tsx}',
        './components/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {
        extend: {
            backgroundImage: {
                noise: 'url(/noise.svg), radial-gradient(80% 150% at 0% 0%, #222222 0%, #111111 100%);',
                'noise-modal':
                    'url(/noise.svg), radial-gradient(81.33% 81.33% at 50% 18.67%, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0) 100%)',
            },
            fontFamily: {
                poppins: ['Poppins', 'sans-serif'],
            },
        },
    },
    plugins: [],
};
