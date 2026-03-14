import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { GitBranch, MessageSquare, ArrowRightCircle, ListTree, AlertTriangle } from 'lucide-react';
import Header from '../components/Header';
import StatusBadge from '../components/StatusBadge';
import { useRFI } from '../context/RFIContext';
import { RFI_STATUS } from '../utils/constants';

const JOURNEY_LANES = [
    { key: 'needs_revision', label: 'Needs Revision' },
    { key: 'resubmitted_review', label: 'Resubmitted Review' },
    { key: 'resolved_after_revision', label: 'Resolved After Revision' },
    { key: 'rejected_again', label: 'Rejected Again' },
];

function getSortValue(rfi) {
    return rfi.reviewedAt || rfi.filedDate || '';
}

export default function RejectionJourneyBoard() {
    const navigate = useNavigate();
    const { rfis } = useRFI();

    const journey = useMemo(() => {
        const byId = new Map((rfis || []).map((rfi) => [rfi.id, rfi]));

        const resolveRootId = (rfi) => {
            let current = rfi;
            let depth = 0;
            while (current?.parentId && byId.has(current.parentId) && depth < 30) {
                current = byId.get(current.parentId);
                depth += 1;
            }
            return current?.id || rfi.id;
        };

        const grouped = new Map();
        (rfis || []).forEach((rfi) => {
            const rootId = resolveRootId(rfi);
            if (!grouped.has(rootId)) grouped.set(rootId, []);
            grouped.get(rootId).push(rfi);
        });

        const lanes = {
            needs_revision: [],
            resubmitted_review: [],
            resolved_after_revision: [],
            rejected_again: [],
        };

        grouped.forEach((chainItems) => {
            const hasRejectionHistory = chainItems.some((rfi) => rfi.status === RFI_STATUS.REJECTED);
            if (!hasRejectionHistory) return;

            const ordered = [...chainItems].sort((a, b) => {
                const aValue = getSortValue(a);
                const bValue = getSortValue(b);
                if (aValue !== bValue) return aValue.localeCompare(bValue);
                return (a.serialNo || 0) - (b.serialNo || 0);
            });

            const latest = ordered[ordered.length - 1];
            const rejectedCount = ordered.filter((rfi) => rfi.status === RFI_STATUS.REJECTED).length;
            const firstRejected = ordered.find((rfi) => rfi.status === RFI_STATUS.REJECTED) || latest;

            const chain = {
                id: latest.id,
                rootId: ordered[0].id,
                latest,
                firstRejected,
                rejectedCount,
                chainDepth: ordered.length,
                chainItems: ordered,
                firstRejectedDate: (firstRejected.reviewedAt || firstRejected.filedDate || '').slice(0, 10) || '—',
                latestDate: (latest.reviewedAt || latest.filedDate || '').slice(0, 10) || '—',
            };

            if (latest.status === RFI_STATUS.REJECTED && rejectedCount >= 2) {
                lanes.rejected_again.push(chain);
                return;
            }

            if (latest.status === RFI_STATUS.REJECTED) {
                lanes.needs_revision.push(chain);
                return;
            }

            if (latest.status === RFI_STATUS.PENDING) {
                lanes.resubmitted_review.push(chain);
                return;
            }

            if (latest.status === RFI_STATUS.APPROVED) {
                lanes.resolved_after_revision.push(chain);
            }
        });

        Object.keys(lanes).forEach((laneKey) => {
            lanes[laneKey].sort((a, b) => b.latestDate.localeCompare(a.latestDate));
        });

        const totalChains = Object.values(lanes).reduce((acc, list) => acc + list.length, 0);

        return { lanes, totalChains };
    }, [rfis]);

    const openRfi = (rfiId) => {
        navigate(`/consultant/review?rfi=${rfiId}&source=rejection-journey`);
    };

    return (
        <div className="page-wrapper">
            <Header />
            <main className="review-page journey-page">
                <div className="sheet-header">
                    <div>
                        <h1><GitBranch size={22} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} />Rejection Journey Board</h1>
                        <p className="subtitle" style={{ marginTop: '0.2rem' }}>
                            Track rejected RFIs from revision request to closure.
                        </p>
                    </div>
                    <div className="journey-health-row">
                        <span className="journey-health-chip">Total Chains: {journey.totalChains}</span>
                        <span className="journey-health-chip warning">
                            <AlertTriangle size={14} /> Needs Attention: {journey.lanes.needs_revision.length + journey.lanes.rejected_again.length}
                        </span>
                    </div>
                </div>

                <div className="journey-lane-grid">
                    {JOURNEY_LANES.map((lane) => {
                        const items = journey.lanes[lane.key] || [];
                        return (
                            <section key={lane.key} className="sheet-section journey-lane">
                                <div className="section-header journey-lane-header">
                                    <h2>{lane.label}</h2>
                                    <span className="journey-lane-count">{items.length}</span>
                                </div>

                                {items.length === 0 ? (
                                    <div className="empty-state" style={{ margin: '0.9rem 1rem 1rem' }}>
                                        <p style={{ margin: 0 }}>No chains in this lane.</p>
                                    </div>
                                ) : (
                                    <div className="journey-lane-list">
                                        {items.map((chain) => (
                                            <article key={chain.id} className="journey-card">
                                                <div className="journey-card-head">
                                                    <div>
                                                        <div className="journey-card-title">RFI #{chain.latest.serialNo}</div>
                                                        <div className="journey-card-meta">
                                                            First Rejected: {chain.firstRejectedDate} · Latest: {chain.latestDate}
                                                        </div>
                                                    </div>
                                                    <StatusBadge status={chain.latest.status} />
                                                </div>

                                                <div className="journey-card-body">
                                                    <p className="journey-card-description">{chain.latest.description}</p>
                                                    <div className="journey-chain-tags">
                                                        <span className="journey-tag">Chain Length: {chain.chainDepth}</span>
                                                        <span className="journey-tag">Reject Count: {chain.rejectedCount}</span>
                                                        <span className="journey-tag">Location: {chain.latest.location || '—'}</span>
                                                    </div>
                                                </div>

                                                <div className="journey-card-actions">
                                                    <button className="btn btn-sm btn-ghost" onClick={() => openRfi(chain.latest.id)}>
                                                        <MessageSquare size={14} /> Open Discussion
                                                    </button>
                                                    <button className="btn btn-sm" onClick={() => openRfi(chain.latest.id)}>
                                                        <ArrowRightCircle size={14} /> Open Latest
                                                    </button>
                                                    <button className="btn btn-sm btn-ghost" onClick={() => openRfi(chain.firstRejected.id)}>
                                                        <ListTree size={14} /> Open Chain
                                                    </button>
                                                </div>
                                            </article>
                                        ))}
                                    </div>
                                )}
                            </section>
                        );
                    })}
                </div>
            </main>
        </div>
    );
}
