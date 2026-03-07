import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useRFI } from '../context/RFIContext';
import { getToday } from '../utils/rfiLogic';
import Header from '../components/Header';
import StatsCard from '../components/StatsCard';
import StatusBadge from '../components/StatusBadge';
import {
    FileText,
    CheckCircle,
    XCircle,
    Clock,
    Plus,
    TrendingUp,
    AlertTriangle,
    Download
} from 'lucide-react';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';

export default function ContractorDashboard() {
    const { user } = useAuth();
    const { rfis, getStats } = useRFI();
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

    return (
        <div className="page-wrapper">
            <Header />
            <main className="dashboard-page">
                <div className="dashboard-header">
                    <div>
                        <h1>Welcome, {user.name}</h1>
                        <p className="subtitle">{user.company} — Contractor Dashboard</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => navigate('/contractor/rfi-sheet')}>
                        <Plus size={18} /> File RFIs
                    </button>
                </div>

                {carryoverCount > 0 && (
                    <div className="carryover-alert">
                        <AlertTriangle size={20} />
                        <span>
                            <strong>{carryoverCount} rejected RFI{carryoverCount > 1 ? 's' : ''}</strong> carried over from previous days — please re-submit today.
                        </span>
                        <button className="btn btn-sm btn-warning" onClick={() => navigate('/contractor/rfi-sheet')}>
                            View Sheet
                        </button>
                    </div>
                )}

                <div className="stats-grid">
                    <StatsCard
                        icon={<FileText size={24} />}
                        label="Total Filed"
                        value={stats.overallTotal}
                        color="#6366f1"
                        subtitle="All time"
                    />
                    <StatsCard
                        icon={<Clock size={24} />}
                        label="Pending"
                        value={stats.overallPending}
                        color="#f59e0b"
                        subtitle="Awaiting review"
                    />
                    <StatsCard
                        icon={<CheckCircle size={24} />}
                        label="Approved"
                        value={stats.overallApproved}
                        color="#10b981"
                        subtitle="All time"
                    />
                    <StatsCard
                        icon={<XCircle size={24} />}
                        label="Rejected"
                        value={stats.overallRejected}
                        color="#ef4444"
                        subtitle="Needs attention"
                    />
                </div>

                <div className="dashboard-section">
                    <div className="section-header">
                        <h2><TrendingUp size={20} /> Recent RFIs</h2>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            {allMyRfis.length > 0 && (
                                <div className="export-actions" style={{ display: 'flex', gap: '0.25rem', marginRight: '1rem' }}>
                                    <button
                                        className="btn btn-ghost btn-sm"
                                        onClick={() => exportToPDF(allMyRfis, `ClearLine_Contractor_Report`)}
                                        title="Export to PDF"
                                    >
                                        <Download size={16} /> PDF
                                    </button>
                                    <button
                                        className="btn btn-ghost btn-sm"
                                        onClick={() => exportToExcel(allMyRfis, `ClearLine_Contractor_Report`)}
                                        title="Export to Excel"
                                    >
                                        <Download size={16} /> Excel
                                    </button>
                                </div>
                            )}
                            <button className="btn btn-ghost" onClick={() => navigate('/contractor/rfi-sheet')}>
                                View All →
                            </button>
                        </div>
                    </div>

                    {myRfis.length === 0 ? (
                        <div className="empty-state">
                            <FileText size={48} />
                            <h3>No RFIs Filed Yet</h3>
                            <p>Start by filing your first Request for Inspection</p>
                            <button className="btn btn-primary" onClick={() => navigate('/contractor/rfi-sheet')}>
                                <Plus size={18} /> File RFIs
                            </button>
                        </div>
                    ) : (
                        <div className="rfi-table-wrapper">
                            <table className="rfi-table editable">
                                <thead>
                                    <tr>
                                        <th className="col-serial">#</th>
                                        <th className="col-desc">Description</th>
                                        <th className="col-loc">Location</th>
                                        <th className="col-type">Type</th>
                                        <th>Date</th>
                                        <th className="col-status">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {myRfis.map((rfi) => (
                                        <tr key={rfi.id} className={rfi.carryoverCount > 0 ? 'carryover-row' : ''}>
                                            <td className="col-serial">{rfi.serialNo}</td>
                                            <td className="col-desc">{rfi.description}</td>
                                            <td className="col-loc">{rfi.location}</td>
                                            <td className="col-type">{rfi.inspectionType}</td>
                                            <td>{rfi.filedDate}</td>
                                            <td className="col-status"><StatusBadge status={rfi.status} /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
