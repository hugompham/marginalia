/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	darkMode: ['selector', '[data-theme="dark"]'],
	theme: {
		extend: {
			colors: {
				// Background colors
				canvas: 'var(--color-canvas)',
				surface: 'var(--color-surface)',
				subtle: 'var(--color-subtle)',

				// Text colors
				primary: 'var(--color-text-primary)',
				secondary: 'var(--color-text-secondary)',
				tertiary: 'var(--color-text-tertiary)',

				// Accent colors
				accent: {
					DEFAULT: 'var(--color-accent)',
					hover: 'var(--color-accent-hover)'
				},
				success: 'var(--color-success)',
				warning: 'var(--color-warning)',
				error: 'var(--color-error)',

				// Border colors
				border: {
					DEFAULT: 'var(--color-border)',
					strong: 'var(--color-border-strong)'
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
				focus: '0 0 0 2px rgba(194, 105, 79, 0.2)'
			},
			maxWidth: {
				content: '680px',
				app: '1440px'
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
