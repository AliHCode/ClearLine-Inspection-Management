import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

export default function RejectModal({ rfi, onReject, onClose }) {
    const [remarks, setRemarks] = useState('');

    function handleSubmit(e) {
        e.preventDefault();
        if (!remarks.trim()) return;
        onReject(rfi.id, remarks.trim());
        onClose();
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="modal-title">
                        <AlertTriangle size={20} color="#ef4444" />
                        <h3>Reject RFI #{rfi.serialNo}</h3>
                    </div>
                    <button className="modal-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>
                <div className="modal-body">
                    <div className="modal-rfi-info">
                        <p><strong>Description:</strong> {rfi.description}</p>
                        <p><strong>Location:</strong> {rfi.location}</p>
                        <p><strong>Type:</strong> {rfi.inspectionType}</p>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <label className="modal-label">
                            Rejection Remarks <span className="required">*</span>
                        </label>
                        <textarea
                            className="modal-textarea"
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            placeholder="Please provide a reason for rejection..."
                            rows={4}
                            required
                            autoFocus
                        />
                        <div className="modal-actions">
                            <button type="button" className="btn btn-secondary" onClick={onClose}>
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-danger" disabled={!remarks.trim()}>
                                Reject RFI
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
