import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useRFI } from '../context/RFIContext';
import { getToday } from '../utils/rfiLogic';
import Header from '../components/Header';
import StatsCard from '../components/StatsCard';
import StatusBadge from '../components/StatusBadge';
import RfiTrendChart from '../components/RfiTrendChart';
import RfiStatusPieChart from '../components/RfiStatusPieChart';
import ActivityTimeline from '../components/ActivityTimeline';
import {
    FileText,
    CheckCircle,
    XCircle,
    Clock,
    Plus,
    TrendingUp,
    AlertTriangle,
    FileDown,
    Table,
    ClipboardList
} from 'lucide-react';
import { exportToExcel, exportToPDF, generateDailyReport } from '../utils/exportUtils';
import { useProject } from '../context/ProjectContext';

export default function ContractorDashboard() {
    const { user } = useAuth();
    const { rfis, getStats } = useRFI();
    const { activeProject, projectFields, orderedTableColumns, columnWidthMap, getTableColumnStyle } = useProject();
    const activeProjectName = activeProject?.name || 'ProWay Project';
    const navigate = useNavigate();
    const today = getToday();
    const stats = getStats(today);

    // Get all RFIs by this contractor
    const allMyRfis = rfis
        .filter((r) => r.filedBy === user.id)
        .sort((a, b) => b.filedDate.localeCompare(a.filedDate) || b.serialNo - a.serialNo);

    // Get recent RFIs by this contractor for display
    const myRfis = allMyRfis.slice(0, 10);

    // Count rejected carryovers
    const carryoverCount = rfis.filter(
        (r) => r.status === 'rejected' && r.carryoverTo === today && r.filedBy === user.id
    ).length;

    const reportRfis = allMyRfis.filter(r =>
        (r.status === 'approved' || r.status === 'rejected') &&
        ((r.reviewedAt && r.reviewedAt.startsWith(today)) || r.filedDate === today)
    );

    // --- Chart Data Preparation ---
    const pieData = [
        { name: 'Approved', value: stats.todayApproved, color: 'var(--clr-success)' },
        { name: 'Pending', value: stats.todayPending, color: 'var(--clr-warning)' },
        { name: 'Rejected', value: stats.todayRejected, color: 'var(--clr-danger)' },
        { name: 'Info Req.', value: stats.todayTotal - (stats.todayApproved + stats.todayPending + stats.todayRejected), color: 'var(--clr-brand-secondary)' },
    ];

    // Group RFIs by date for the area chart (last 7 days of activity)
    const trendMap = {};
    allMyRfis.forEach(r => {
        const d = r.filedDate;
        trendMap[d] = (trendMap[d] || 0) + 1;
    });

    // Convert to array, sort chronologically, and take last 7
    const trendData = Object.keys(trendMap)
        .sort() // simple string sort works for YYYY-MM-DD
        .map(date => ({
            date: date.substring(5), // Just MM-DD for cleaner X-axis
            value: trendMap[date]
        }))
        .slice(-7);

    const contractorVisibleColumns = orderedTableColumns.filter(c => c.field_key !== 'actions');

    function renderContractorCell(rfi, col) {
        if (col.field_key === 'serial') return rfi.serialNo;
        if (col.field_key === 'description') return rfi.description;
        if (col.field_key === 'location') return rfi.location;
        if (col.field_key === 'inspection_type') return rfi.inspectionType;
        if (col.field_key === 'status') return <StatusBadge status={rfi.status} />;
        if (col.field_key === 'remarks') return rfi.remarks || '—';
        if (col.field_key === 'attachments') return (rfi.images?.length || 0) > 0 ? `${rfi.images.length} file(s)` : '—';
        return rfi.customFields?.[col.field_key] || '—';
    }

    return (
        <div className="page-wrapper premium-dashboard">
            <Header />
            <main className="dashboard-page">
                <header className="premium-header">
                    <div className="premium-welcome">
                        <h1>Welcome, {user?.name || 'Contractor'}</h1>
                        <p>{user?.company || 'ProWay'} — Contractor Workspace</p>
                    </div>
                    <button className="btn-command" onClick={() => navigate('/contractor/rfi-sheet')}>
                        <Plus size={18} strokeWidth={2.5} /> File RFIs
                    </button>
                </header>

                <div className="bento-grid">
                    {/* Stats Section */}
                    <div className="bento-span-3">
                        <StatsCard
                            icon={<FileText size={20} />}
                            label="Total Filed"
                            value={stats.todayTotal}
                            subtitle="Today"
                            trend="up"
                            trendValue="+12%"
                            color="#3b82f6"
                        />
                    </div>
                    <div className="bento-span-3">
                        <StatsCard
                            icon={<Clock size={20} />}
                            label="Awaiting"
                            value={stats.todayPending}
                            subtitle="Review queue"
                            trend="down"
                            trendValue="-5%"
                            color="#f59e0b"
                        />
                    </div>
                    <div className="bento-span-3">
                        <StatsCard
                            icon={<CheckCircle size={20} />}
                            label="Approved"
                            value={stats.todayApproved}
                            subtitle="Daily Verified"
                            trend="up"
                            trendValue="+8%"
                            color="#10b981"
                        />
                    </div>
                    <div className="bento-span-3">
                        <StatsCard
                            icon={<XCircle size={20} />}
                            label="Rejected"
                            value={stats.todayRejected}
                            subtitle="Action required"
                            trend="up"
                            trendValue="+2%"
                            color="#ef4444"
                        />
                    </div>

                    {/* Chart Section */}
                    <div className="bento-span-8 bento-row-2">
                        <RfiTrendChart data={trendData} />
                    </div>
                    <div className="bento-span-4 bento-row-2">
                        <RfiStatusPieChart data={pieData} />
                    </div>

                    {/* Secondary Section */}
                    <div className="bento-span-8 premium-card">
                        <div className="section-header" style={{ border: 'none', padding: 0, marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1rem', fontWeight: 600 }}><TrendingUp size={18} style={{ marginRight: '0.5rem' }} /> Recent Activity</h2>
                            <button className="btn btn-ghost" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--clr-brand-secondary)' }} onClick={() => navigate('/contractor/summary')}>
                                View All History →
                            </button>
                        </div>
                        
                        {myRfis.length === 0 ? (
                            <div className="empty-state" style={{ padding: '2rem' }}>
                                <p>No recent activity detected.</p>
                            </div>
                        ) : (
                            <div className="rfi-table-wrapper" style={{ border: 'none' }}>
                                <table className="rfi-table">
                                    <thead>
                                        <tr>
                                            {contractorVisibleColumns.slice(0, 4).map((col) => (
                                                <th key={col.field_key} style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{col.field_name}</th>
                                            ))}
                                            <th style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {myRfis.slice(0, 5).map((rfi) => (
                                            <tr key={rfi.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                {contractorVisibleColumns.slice(0, 4).map((col) => (
                                                    <td key={`${rfi.id}_${col.field_key}`} style={{ fontSize: '0.9rem', padding: '0.75rem 0.5rem' }}>
                                                        {renderContractorCell(rfi, col)}
                                                    </td>
                                                ))}
                                                <td style={{ fontSize: '0.9rem', padding: '0.75rem 0.5rem', color: '#64748b' }}>{rfi.filedDate}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    <div className="bento-span-4 premium-card">
                        <div className="section-header" style={{ border: 'none', padding: 0, marginBottom: '1rem' }}>
                            <h2 style={{ fontSize: '1rem', fontWeight: 600 }}><Clock size={18} style={{ marginRight: '0.5rem' }} /> Event Log</h2>
                        </div>
                        <ActivityTimeline rfis={allMyRfis.filter(r => r.filedDate === today)} limit={4} />
                    </div>
                </div>
            </main>
        </div>
    );
}
