export default {
    content: ['./index.html', './src/**/*.{js,jsx}'],
    theme: {
        extend: {
            colors: {
                // Primary Lavender Palette
                lavender: {
                    50: '#faf8ff',
                    100: '#f5f2ff',
                    200: '#ede9fe',
                    300: '#ddd6fe',
                    400: '#c4b5fd',
                    500: '#a78bfa',
                    600: '#9333ea',
                    700: '#7e22ce',
                    800: '#6b21a8',
                    900: '#581c87',
                },
                // Dark Background Palette (base: #171717)
                dark: {
                    50: '#f9fafb',
                    100: '#f3f4f6',
                    200: '#e5e7eb',
                    300: '#d1d5db',
                    400: '#9ca3af',
                    500: '#6b7280',
                    600: '#2d2d2d',
                    700: '#1f1f1f',
                    800: '#171717', // Primary base
                    900: '#0d0d0d',
                    950: '#000000',
                },
                // Custom dark shades for consistency
                'bg-dark': '#171717',
                'bg-darker': '#0f0f0f',
                'border-dark': '#2d2d2d',
                'border-darker': '#1f1f1f',
            },
            backgroundImage: {
                'gradient-dark': 'linear-gradient(135deg, #171717 0%, #1f1f1f 50%, #0f0f0f 100%)',
                'gradient-lavender': 'linear-gradient(135deg, #9333ea 0%, #7e22ce 100%)',
            },
        },
    },
    plugins: [],
}
