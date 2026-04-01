export default {
    content: ['./index.html', './src/**/*.{js,jsx}'],
    theme: {
        extend: {
            colors: {
                lavender: {
                    50: '#f9f8ff',
                    100: '#f3f0ff',
                    200: '#ede9fe',
                    300: '#ddd6fe',
                    400: '#c4b5fd',
                    500: '#a78bfa',
                    600: '#9333ea',
                    700: '#7e22ce',
                    800: '#6b21a8',
                    900: '#581c87',
                },
                dark: {
                    50: '#f9fafb',
                    100: '#f3f4f6',
                    200: '#e5e7eb',
                    300: '#d1d5db',
                    400: '#9ca3af',
                    500: '#6b7280',
                    600: '#3a3a3a',
                    700: '#404040',
                    800: '#404040',
                    900: '#0d0d0d',
                    950: '#171717',
                },
            },
            backgroundImage: {
                'gradient-dark': 'linear-gradient(135deg, #0d0d0d 0%, #1a1a1a 50%, #000000 100%)',
            },
        },
    },
    plugins: [],
}
