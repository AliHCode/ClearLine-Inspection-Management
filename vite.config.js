import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            // Use injectManifest so we can add push + notificationclick handlers
            strategies: 'injectManifest',
            srcDir: 'src',
            filename: 'sw.js',
            injectManifest: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
                maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10 MiB
            },
            manifest: {
                name: 'ProWay Inspections',
                short_name: 'ProWay',
                description: 'RFI Management System for Construction',
                theme_color: '#111827',
                background_color: '#FAFAFA',
                display: 'standalone',
                icons: [
                    { src: '/favicon.png', sizes: '192x192', type: 'image/png' },
                    { src: '/dashboardlogo.png', sizes: '512x512', type: 'image/png' }
                ]
            }
        })
    ],
});
