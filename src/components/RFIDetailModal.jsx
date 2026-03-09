import { useState } from 'react';
import { X, Calendar, MapPin, Tag, User, MessageSquare, History } from 'lucide-react';
import ThreadedComments from './ThreadedComments';
import AuditLog from './AuditLog';
import StatusBadge from './StatusBadge';
import { formatDateDisplay } from '../utils/rfiLogic';

export default function RFIDetailModal({ rfi, onClose }) {
    const [activeTab, setActiveTab] = useState('discussion');
    if (!rfi) return null;

    return (
        <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
            <div className="modal-content rfi-detail-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header rfi-detail-header">
                    <div className="modal-title rfi-detail-title">
                        <div>
                            <div className="rfi-title-row">
                                <h2>RFI #{rfi.serialNo}</h2>
                                <StatusBadge status={rfi.status} />
                            </div>
                            <p>{rfi.description}</p>
                        </div>
                        <button className="btn-close" onClick={onClose}>
                            <X size={24} color="var(--clr-text-secondary)" />
                        </button>
                    </div>
                </div>

                <div className="modal-body rfi-detail-body">
                    <aside className="rfi-details-pane">
                        <h4 className="rfi-pane-heading">Inspection Details</h4>

                        <div className="rfi-detail-list">
                            <div className="rfi-detail-item">
                                <MapPin size={18} color="var(--clr-text-muted)" />
                                <div>
                                    <div className="rfi-detail-label">Location</div>
                                    <div className="rfi-detail-value">{rfi.location}</div>
                                </div>
                            </div>

                            <div className="rfi-detail-item">
                                <Tag size={18} color="var(--clr-text-muted)" />
                                <div>
                                    <div className="rfi-detail-label">Type</div>
                                    <div className="rfi-detail-value">{rfi.inspectionType}</div>
                                </div>
                            </div>

                            <div className="rfi-detail-item">
                                <Calendar size={18} color="var(--clr-text-muted)" />
                                <div>
                                    <div className="rfi-detail-label">Filed Date</div>
                                    <div className="rfi-detail-value">{formatDateDisplay(rfi.originalFiledDate)}</div>
                                </div>
                            </div>

                            <div className="rfi-detail-item">
                                <User size={18} color="var(--clr-text-muted)" />
                                <div>
                                    <div className="rfi-detail-label">Filed By</div>
                                    <div className="rfi-detail-value">{rfi.filerName}</div>
                                    <div className="rfi-detail-subvalue">{rfi.filerCompany}</div>
                                </div>
                            </div>
                        </div>

                        {rfi.remarks && (
                            <div className="rfi-latest-remarks">
                                <div className="rfi-detail-label">Latest Remarks</div>
                                <div>"{rfi.remarks}"</div>
                            </div>
                        )}

                        {rfi.images && rfi.images.length > 0 && (
                            <div className="rfi-attachments-pane">
                                <h4 className="rfi-pane-heading">Attachments</h4>
                                <div className="rfi-attachments-grid">
                                    {rfi.images.map((img, idx) => (
                                        <a key={idx} href={img} target="_blank" rel="noopener noreferrer" className="rfi-attachment-thumb">
                                            <img src={img} alt={`Attachment ${idx + 1}`} />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </aside>

                    <section className="rfi-discussion-pane">
                        <div className="rfi-tabs">
                            <button
                                onClick={() => setActiveTab('discussion')}
                                className={`rfi-tab-btn ${activeTab === 'discussion' ? 'active' : ''}`}
                            >
                                <MessageSquare size={16} /> Discussion
                            </button>
                            <button
                                onClick={() => setActiveTab('audit')}
                                className={`rfi-tab-btn ${activeTab === 'audit' ? 'active' : ''}`}
                            >
                                <History size={16} /> Audit Trail
                            </button>
                        </div>

                        <div className="rfi-tab-panel">
                            {activeTab === 'discussion' ? (
                                <ThreadedComments rfiId={rfi.id} />
                            ) : (
                                <AuditLog rfiId={rfi.id} />
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
