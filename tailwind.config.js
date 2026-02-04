/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				// Background colors
				canvas: '#FAF9F7',
				surface: '#FFFFFF',
				subtle: '#F5F3F0',

				// Text colors
				primary: '#1A1A1A',
				secondary: '#6B6B6B',
				tertiary: '#9B9B9B',

				// Accent colors
				accent: {
					DEFAULT: '#C2694F',
					hover: '#A85640'
				},
				success: '#4A7C59',
				warning: '#C9A227',
				error: '#B54B4B',

				// Border colors
				border: {
					DEFAULT: '#E8E6E3',
					strong: '#D4D1CC'
				}
			},
			fontFamily: {
				heading: ['Newsreader', 'Georgia', 'serif'],
				body: ['Inter', 'system-ui', 'sans-serif'],
				mono: ['JetBrains Mono', 'monospace']
			},
			fontSize: {
				xs: ['0.75rem', { lineHeight: '1.25' }],
				sm: ['0.875rem', { lineHeight: '1.6' }],
				base: ['1rem', { lineHeight: '1.6' }],
				lg: ['1.125rem', { lineHeight: '1.6' }],
				xl: ['1.25rem', { lineHeight: '1.25' }],
				'2xl': ['1.5rem', { lineHeight: '1.25' }],
				'3xl': ['2rem', { lineHeight: '1.25' }]
			},
			spacing: {
				xs: '4px',
				sm: '8px',
				md: '12px',
				lg: '16px',
				xl: '24px',
				'2xl': '32px',
				'3xl': '48px'
			},
			borderRadius: {
				card: '8px',
				button: '6px',
				input: '6px'
			},
			boxShadow: {
				card: '0 1px 3px rgba(0,0,0,0.04)',
				'card-hover': '0 2px 8px rgba(0,0,0,0.08)',
				'focus': '0 0 0 2px rgba(194, 105, 79, 0.2)'
			},
			maxWidth: {
				content: '680px',
				app: '1280px'
			},
			transitionDuration: {
				fast: '150ms',
				normal: '250ms',
				slow: '400ms'
			},
			transitionTimingFunction: {
				'ease-default': 'cubic-bezier(0.4, 0, 0.2, 1)',
				'ease-enter': 'cubic-bezier(0, 0, 0.2, 1)',
				'ease-exit': 'cubic-bezier(0.4, 0, 1, 1)'
			},
			screens: {
				mobile: { max: '639px' },
				tablet: { min: '640px', max: '1023px' },
				desktop: { min: '1024px' }
			}
		}
	},
	plugins: [require('@tailwindcss/typography')]
};
