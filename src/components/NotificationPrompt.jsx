import { useState, useEffect } from 'react';
import { Bell, X, BellRing } from 'lucide-react';
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

        const checkPermission = async () => {
            // If already granted or denied, don't show prompt
            if (Notification.permission !== 'default') return;

            // Check if dismissed in this session
            const isDismissed = sessionStorage.getItem('proway_push_prompt_dismissed');
            if (isDismissed) return;

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
        sessionStorage.setItem('proway_push_prompt_dismissed', 'true');
    };

    if (!isVisible) return null;

    return (
        <div className="notif-overlay-v2">
            <div className="notif-modal-v2">
                <div className="notif-modal-header">
                    <div className="notif-modal-icon">
                        <BellRing className="pulse-icon" size={32} />
                    </div>
                    <button className="notif-modal-close" onClick={handleDismiss}>
                        <X size={20} />
                    </button>
                </div>
                
                <div className="notif-modal-body">
                    <h2>Stay in the Loop</h2>
                    <p>
                        Enable real-time push notifications to receive instant updates on 
                        RFI approvals, rejections, and direct mentions even when you're 
                        not actively using the app.
                    </p>
                </div>

                <div className="notif-modal-footer">
                    <button 
                        className="btn-modal-dismiss" 
                        onClick={handleDismiss}
                        disabled={isProcessing}
                    >
                        Maybe Later
                    </button>
                    <button 
                        className="btn-modal-primary" 
                        onClick={handleEnable}
                        disabled={isProcessing}
                    >
                        {isProcessing ? (
                            <span className="btn-loading-flex">
                                <Activity className="spin-slow" size={16} />
                                Enabling...
                            </span>
                        ) : 'Enable Notifications'}
                    </button>
                </div>
            </div>
        </div>
    );
}
