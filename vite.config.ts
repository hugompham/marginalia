import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		watch: {
			// Enable polling for Docker bind-mount HMR (filesystem events don't propagate on macOS)
			usePolling: !!process.env.DOCKER_ENV,
			interval: 1000
		}
	}
});
