import { useAuth } from '../context/AuthContext';
import { Clock, ShieldX, LogOut } from 'lucide-react';

export default function PendingApproval() {
    const { user, logout } = useAuth();
    const isRejected = user?.role === 'rejected';
    const firstName = user?.name?.split(' ')[0] || 'there';

    return (
        <div style={styles.page}>
            <div style={styles.card}>
                <div style={styles.iconWrap}>
                    {isRejected
                        ? <ShieldX size={56} color="#ef4444" strokeWidth={1.4} />
                        : <Clock size={56} color="#3b82f6" strokeWidth={1.4} />
                    }
                </div>

                {isRejected ? (
                    <>
                        <h1 style={styles.title}>Access Denied</h1>
                        <p style={styles.message}>
                            Sorry <strong>{firstName}</strong>, your account request was not approved by the administrator.
                        </p>
                        <p style={styles.sub}>
                            If you believe this is a mistake, please contact your project manager or administrator.
                        </p>
                    </>
                ) : (
                    <>
                        <h1 style={styles.title}>Welcome, {firstName}!</h1>
                        <p style={styles.message}>
                            Your account has been created successfully.
                        </p>
                        <div style={styles.statusBox}>
                            <div style={styles.dot} />
                            <span>Waiting for admin approval</span>
                        </div>
                        <p style={styles.sub}>
                            An administrator will review and approve your account shortly.
                            You'll be able to access the system once approved.
                        </p>
                    </>
                )}

                <button onClick={logout} style={styles.btn}>
                    <LogOut size={16} />
                    Sign Out
                </button>
            </div>
        </div>
    );
}

const styles = {
    page: {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
        padding: '1.5rem',
    },
    card: {
        background: '#fff',
        borderRadius: '1rem',
        padding: '3rem 2.5rem',
        maxWidth: '440px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    },
    iconWrap: {
        marginBottom: '1.5rem',
    },
    title: {
        fontSize: '1.75rem',
        fontWeight: 700,
        color: '#0f172a',
        margin: '0 0 0.75rem',
    },
    message: {
        fontSize: '1.05rem',
        color: '#334155',
        lineHeight: 1.6,
        margin: '0 0 1rem',
    },
    statusBox: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        background: '#eff6ff',
        border: '1px solid #bfdbfe',
        borderRadius: '2rem',
        padding: '0.5rem 1.25rem',
        fontSize: '0.95rem',
        fontWeight: 600,
        color: '#1d4ed8',
        marginBottom: '1rem',
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: '#3b82f6',
        animation: 'pulse 1.5s ease-in-out infinite',
    },
    sub: {
        fontSize: '0.9rem',
        color: '#64748b',
        lineHeight: 1.5,
        margin: '0 0 2rem',
    },
    btn: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.7rem 1.5rem',
        fontSize: '0.95rem',
        fontWeight: 600,
        color: '#fff',
        background: '#0f172a',
        border: 'none',
        borderRadius: '0.5rem',
        cursor: 'pointer',
    },
};
