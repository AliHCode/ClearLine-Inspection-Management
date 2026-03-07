import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useRFI } from '../context/RFIContext';
import { getToday } from '../utils/rfiLogic';
import Header from '../components/Header';
import StatsCard from '../components/StatsCard';
import {
    FileSearch,
    CheckCircle,
    XCircle,
    Clock,
    ClipboardCheck,
    AlertTriangle,
    Users,
} from 'lucide-react';

export default function ConsultantDashboard() {
    const { user } = useAuth();
    const { rfis, getStats, getReviewQueue } = useRFI();
    const navigate = useNavigate();
    const today = getToday();
    const stats = getStats(today);
    const queue = getReviewQueue(today);

    return (
        <div className="page-wrapper">
            <Header />
            <main className="dashboard-page">
                <div className="dashboard-header">
                    <div>
                        <h1>Welcome, {user.name}</h1>
                        <p className="subtitle">{user.company} — Consultant Dashboard</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => navigate('/consultant/review')}>
                        <FileSearch size={18} /> Review RFIs
                    </button>
                </div>

                {queue.all.length > 0 && (
                    <div className="carryover-alert">
                        <ClipboardCheck size={20} />
                        <span>
                            <strong>{queue.all.length} RFI{queue.all.length > 1 ? 's' : ''}</strong> awaiting your review
                            {queue.carriedOver.length > 0 && (
                                <> — including <strong>{queue.carriedOver.length} rejected carryover{queue.carriedOver.length > 1 ? 's' : ''}</strong></>
                            )}
                        </span>
                        <button className="btn btn-sm btn-primary" onClick={() => navigate('/consultant/review')}>
                            Review Now
                        </button>
                    </div>
                )}

                <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                    <StatsCard
                        icon={<FileSearch size={22} />}
                        label="Pending Review"
                        value={stats.queueTotal}
                        color="#6366f1"
                        subtitle="Awaiting your action"
                    />
                    <StatsCard
                        icon={<CheckCircle size={22} />}
                        label="Approved Today"
                        value={stats.reviewedApprovedToday}
                        color="#10b981"
                        subtitle="Caught up"
                    />
                    <StatsCard
                        icon={<XCircle size={22} />}
                        label="Rejected Today"
                        value={stats.reviewedRejectedToday}
                        color="#ef4444"
                        subtitle="Sent back"
                    />
                </div>

                <div className="dashboard-section">
                    <div className="section-header">
                        <h2><AlertTriangle size={20} /> Review Queue Summary</h2>
                    </div>

                    {queue.all.length === 0 ? (
                        <div className="empty-state">
                            <CheckCircle size={48} />
                            <h3>All Caught Up!</h3>
                            <p>No RFIs are waiting for review right now.</p>
                        </div>
                    ) : (
                        <div className="review-summary">
                            {queue.carriedOver.length > 0 && (
                                <div className="summary-item rejected">
                                    <XCircle size={20} />
                                    <span>{queue.carriedOver.length} rejected carryover{queue.carriedOver.length > 1 ? 's' : ''} need re-review</span>
                                </div>
                            )}
                            {queue.pending.length > 0 && (
                                <div className="summary-item pending">
                                    <Clock size={20} />
                                    <span>{queue.pending.length} new RFI{queue.pending.length > 1 ? 's' : ''} pending first review</span>
                                </div>
                            )}
                            <button className="btn btn-primary" onClick={() => navigate('/consultant/review')} style={{ marginTop: '1rem' }}>
                                <FileSearch size={18} /> Open Review Queue
                            </button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
