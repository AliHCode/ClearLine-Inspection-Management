import { useEffect, useState } from 'react';
import InstallAppPrompt from './InstallAppPrompt';

function ConnectivityBanner() {
    const [isOnline, setIsOnline] = useState(window.navigator.onLine);
    const [showOnlinePulse, setShowOnlinePulse] = useState(false);

    useEffect(() => {
        let onlinePulseTimer;

        const handleOffline = () => {
            setIsOnline(false);
            setShowOnlinePulse(false);
        };

        const handleOnline = () => {
            setIsOnline(true);
            setShowOnlinePulse(true);
            onlinePulseTimer = window.setTimeout(() => {
                setShowOnlinePulse(false);
            }, 4500);
        };

        window.addEventListener('offline', handleOffline);
        window.addEventListener('online', handleOnline);

        return () => {
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('online', handleOnline);
            if (onlinePulseTimer) window.clearTimeout(onlinePulseTimer);
        };
    }, []);

    if (isOnline && !showOnlinePulse) return null;

    return (
        <div className={`connectivity-banner ${isOnline ? 'online' : 'offline'}`} role="status" aria-live="polite">
            {isOnline
                ? 'Back online. Syncing latest updates.'
                : 'You are offline. You can keep working and sync resumes automatically when connected.'}
        </div>
    );
}

export default function AppExperienceEnhancements() {
    useEffect(() => {
        const media = window.matchMedia('(display-mode: standalone)');

        const applyDisplayClass = () => {
            const standalone = media.matches || window.navigator.standalone === true;
            document.body.classList.toggle('app-standalone', standalone);
        };

        applyDisplayClass();

        if (media.addEventListener) {
            media.addEventListener('change', applyDisplayClass);
        } else {
            media.addListener(applyDisplayClass);
        }

        return () => {
            if (media.removeEventListener) {
                media.removeEventListener('change', applyDisplayClass);
            } else {
                media.removeListener(applyDisplayClass);
            }
        };
    }, []);

    return (
        <>
            <ConnectivityBanner />
            <InstallAppPrompt />
        </>
    );
}
