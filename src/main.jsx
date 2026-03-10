import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.jsx'

// Register SW — show a non-blocking banner when an update is ready
let _updateSW;

function showUpdateBanner() {
    if (document.getElementById('pwa-update-banner')) return;
    const banner = document.createElement('div');
    banner.id = 'pwa-update-banner';
    Object.assign(banner.style, {
        position: 'fixed', bottom: '1.25rem', left: '50%', transform: 'translateX(-50%)',
        background: '#1e293b', color: '#f8fafc', padding: '0.75rem 1.25rem',
        borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        fontSize: '0.9rem', zIndex: '9999', whiteSpace: 'nowrap',
    });
    banner.innerHTML = `
        <span>🔄 New version available</span>
        <button id="pwa-update-btn" style="padding:0.35rem 0.85rem;background:#3b82f6;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:600;">Update now</button>
        <button id="pwa-update-close" style="background:none;border:none;color:#94a3b8;cursor:pointer;font-size:1.1rem;line-height:1;padding:0 4px;">×</button>
    `;
    document.body.appendChild(banner);
    document.getElementById('pwa-update-btn').onclick = () => { _updateSW && _updateSW(true); };
    document.getElementById('pwa-update-close').onclick = () => banner.remove();
}

_updateSW = registerSW({
    immediate: false,
    onNeedRefresh() { showUpdateBanner(); },
    onOfflineReady() { console.log('App ready to work offline'); },
});

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <App />
    </StrictMode>,
)
