import { useEffect, useMemo, useState } from 'react';

const DISMISS_KEY = 'saa_install_prompt_dismissed_at';
const DISMISS_INTERVAL_MS = 1000 * 60 * 60 * 24 * 3;

function shouldShowPrompt() {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return true;
    const lastDismissedAt = Number(raw);
    if (!Number.isFinite(lastDismissedAt)) return true;
    return Date.now() - lastDismissedAt > DISMISS_INTERVAL_MS;
}

export default function InstallAppPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [visible, setVisible] = useState(false);
    const [showIosSteps, setShowIosSteps] = useState(false);

    const isStandalone = useMemo(() => {
        return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    }, []);

    const isIOS = useMemo(() => {
        return /iphone|ipad|ipod/i.test(window.navigator.userAgent || '');
    }, []);

    const isSafari = useMemo(() => {
        const ua = window.navigator.userAgent || '';
        return /safari/i.test(ua) && !/chrome|android|crios|fxios/i.test(ua);
    }, []);

    useEffect(() => {
        if (isStandalone || !shouldShowPrompt()) return;

        const onBeforeInstallPrompt = (event) => {
            event.preventDefault();
            setDeferredPrompt(event);
            setVisible(true);
        };

        const onAppInstalled = () => {
            setVisible(false);
            setDeferredPrompt(null);
            localStorage.removeItem(DISMISS_KEY);
        };

        window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
        window.addEventListener('appinstalled', onAppInstalled);

        if (isIOS && isSafari) {
            setVisible(true);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
            window.removeEventListener('appinstalled', onAppInstalled);
        };
    }, [isStandalone, isIOS, isSafari]);

    if (!visible || isStandalone) return null;

    const dismiss = () => {
        localStorage.setItem(DISMISS_KEY, String(Date.now()));
        setVisible(false);
        setShowIosSteps(false);
    };

    const install = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const result = await deferredPrompt.userChoice;
        if (result?.outcome !== 'accepted') {
            dismiss();
            return;
        }
        setVisible(false);
        setDeferredPrompt(null);
        localStorage.removeItem(DISMISS_KEY);
    };

    return (
        <aside className="install-app-prompt" role="status" aria-live="polite">
            <div className="install-app-content">
                <p className="install-app-title">Install this app for faster access</p>
                <p className="install-app-subtitle">
                    Open from your home screen, receive updates, and run in full-screen app mode.
                </p>

                {isIOS && isSafari && !deferredPrompt ? (
                    <>
                        {showIosSteps && (
                            <ol className="install-ios-steps">
                                <li>Tap the Share button in Safari.</li>
                                <li>Select Add to Home Screen.</li>
                                <li>Tap Add to finish.</li>
                            </ol>
                        )}
                        <div className="install-app-actions">
                            <button type="button" className="btn btn-secondary" onClick={() => setShowIosSteps((v) => !v)}>
                                {showIosSteps ? 'Hide steps' : 'Show iPhone install steps'}
                            </button>
                            <button type="button" className="btn btn-ghost" onClick={dismiss}>Not now</button>
                        </div>
                    </>
                ) : (
                    <div className="install-app-actions">
                        <button type="button" className="btn btn-primary" onClick={install} disabled={!deferredPrompt}>
                            Install app
                        </button>
                        <button type="button" className="btn btn-ghost" onClick={dismiss}>Not now</button>
                    </div>
                )}
            </div>
        </aside>
    );
}
