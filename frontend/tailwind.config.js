/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class', // Enable class-based dark mode
    theme: {
        extend: {
            colors: {
                // LeetCode Brand Color
                'brand-orange': '#ffa116',

                // Difficulty Colors (same for both themes)
                'difficulty-easy': '#00b8a3',
                'difficulty-medium': '#ffc01e',
                'difficulty-hard': '#ff375f',

                // Dark Theme Colors - Flattened structure
                'dark-bg-primary': '#1a1a1a',
                'dark-bg-secondary': '#282828',
                'dark-bg-tertiary': '#2d2d2d',
                'dark-bg-elevated': '#333333',

                'dark-text-primary': '#eff1f6bf',
                'dark-text-secondary': '#a8a8a8',
                'dark-text-tertiary': '#6c6c6c',

                'dark-border-primary': '#3e3e3e',
                'dark-border-secondary': '#4a4a4a',
                'dark-border-tertiary': '#5a5a5a',

                // Light Theme Colors - Flattened structure
                'light-bg-primary': '#ffffff',
                'light-bg-secondary': '#f7f8fa',
                'light-bg-tertiary': '#eff1f6',
                'light-bg-elevated': '#fafafa',

                'light-text-primary': '#262626',
                'light-text-secondary': '#4a4a4a',
                'light-text-tertiary': '#8c8c8c',

                'light-border-primary': '#e5e5e5',
                'light-border-secondary': '#d4d4d4',
                'light-border-tertiary': '#c4c4c4',
            },
            fontFamily: {
                sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
                mono: ['Source Code Pro', 'Menlo', 'Monaco', 'Consolas', 'Courier New', 'monospace'],
            },
            animation: {
                'fade-in': 'fadeIn 0.2s ease-in-out',
                'slide-up': 'slideUp 0.2s ease-out',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(10px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
            },
        },
    },
    plugins: [],
}
