import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	build: {
		rollupOptions: {
			// Asegurar que sw.js no sea procesado por Vite
			external: ['/sw.js']
		}
	},
	server: {
		fs: {
			// Permitir servir archivos desde static
			allow: ['..']
		}
	}
});
