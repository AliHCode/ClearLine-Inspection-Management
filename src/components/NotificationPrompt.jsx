import { useState, useEffect } from 'react';
import { X, Activity, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { syncPushSubscriptionForUser } from '../utils/pushNotifications';
import { toast } from 'react-hot-toast';

export default function NotificationPrompt() {
    const { user } = useAuth();
    const [isVisible, setIsVisible] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        // Only check if user is logged in and browser supports notifications
        if (!user || typeof Notification === 'undefined') return;

        const checkPermission = () => {
            // If already granted or denied, don't show prompt
            if (Notification.permission !== 'default') return;

            // Check if dismissed in last 24 hours
            const lastDismissed = localStorage.getItem('proway_push_prompt_last_dismissed');
            if (lastDismissed) {
                const now = Date.now();
                const twentyFourHours = 24 * 60 * 60 * 1000;
                if (now - parseInt(lastDismissed) < twentyFourHours) return;
            }

            // Delay showing slightly for better UX
            const timer = setTimeout(() => {
                setIsVisible(true);
            }, 3000);

            return () => clearTimeout(timer);
        };

        checkPermission();
    }, [user]);

    const handleEnable = async () => {
        if (!user) return;
        setIsProcessing(true);
        try {
            const result = await Notification.requestPermission();
            if (result === 'granted') {
                const res = await syncPushSubscriptionForUser(user.id);
                if (res.status === 'registered') {
                    toast.success("Push notifications enabled!");
                    localStorage.removeItem('proway_push_prompt_last_dismissed');
                } else {
                    toast.error("Failed to register for push notifications.");
                }
            } else if (result === 'denied') {
                toast.error("Notifications blocked. You can enable them in browser settings.");
            }
        } catch (error) {
            console.error('Error enabling notifications:', error);
            toast.error("An error occurred while enabling notifications.");
        } finally {
            setIsProcessing(false);
            setIsVisible(false);
        }
    };

    const handleDismiss = () => {
        setIsVisible(false);
        localStorage.setItem('proway_push_prompt_last_dismissed', Date.now().toString());
    };

    if (!isVisible) return null;

    return (
        <div className="notif-overlay-v2">
            <div className="notif-modal-v2">
                <style>{`
                    .btn-modal-primary-full {
                        width: 100%;
                        background: var(--clr-brand-primary);
                        color: white;
                        border: none;
                        border-radius: 14px;
                        padding: 1rem;
                        font-size: 1rem;
                        font-weight: 700;
                        cursor: pointer;
                        transition: all 0.2s;
                        box-shadow: var(--shadow-md);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 0.5rem;
                    }
                    .btn-modal-primary-full:hover:not(:disabled) {
                        background: var(--clr-brand-secondary);
                        transform: translateY(-2px);
                        box-shadow: var(--shadow-lg);
                    }
                `}</style>
                <div className="notif-modal-header">
                    <div className="notif-modal-icon-container">
                        <img src="/notifications.png" alt="Stay in the Loop" className="notif-modal-img" />
                    </div>
                    <button className="notif-modal-close" onClick={handleDismiss}>
                        <X size={20} />
                    </button>
                </div>
                
                <div className="notif-modal-body">
                    <h2>Stay in the Loop</h2>
                    <p>
                        Enable push notifications to receive real-time updates on 
                        RFI approvals and direct mentions.
                    </p>
                </div>

                <div className="notif-modal-footer">
                    <button 
                        className="btn-modal-primary-full" 
                        onClick={handleEnable}
                        disabled={isProcessing}
                    >
                        {isProcessing ? (
                            <>
                                <Activity className="spin-slow" size={18} />
                                Enabling...
                            </>
                        ) : (
                            <>
                                <Bell size={18} />
                                Enable Notifications
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
