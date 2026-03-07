import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg}']
            },
            manifest: {
                name: 'ClearLine Inspections',
                short_name: 'ClearLine',
                description: 'RFI Management System for Construction',
                theme_color: '#ffffff',
                background_color: '#ffffff',
                display: 'standalone'
            }
        })
    ],
});
