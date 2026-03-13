import { useState, useRef, useEffect } from 'react';
import { X, Pencil, Upload, Brush, Save, MapPin, Tag, FileText, Camera } from 'lucide-react';
import { INSPECTION_TYPES } from '../utils/constants';
import ImageMarkupModal from './ImageMarkupModal';

export default function EditRFIModal({ rfi, projectFields = [], orderedColumns = [], onSave, onClose }) {
    const [description, setDescription] = useState(rfi.description || '');
    const [location, setLocation] = useState(rfi.location || '');
    const [inspectionType, setInspectionType] = useState(rfi.inspectionType || INSPECTION_TYPES[0]);
    const [remarks, setRemarks] = useState(rfi.remarks || '');
    const [existingImages, setExistingImages] = useState(rfi.images || []);
    const [newFiles, setNewFiles] = useState([]);
    const [customFields, setCustomFields] = useState(rfi.customFields || {});
    const [markupTarget, setMarkupTarget] = useState(null); // { source: 'existing'|'new', index }
    const fileInputRef = useRef(null);

    function handleSubmit(e) {
        e.preventDefault();
        if (!description.trim() || !location.trim()) return;
        const confirmed = window.confirm('Save changes to this inspection?');
        if (!confirmed) return;
        onSave({
            description: description.trim(),
            location: location.trim(),
            inspectionType,
            remarks: remarks.trim(),
            existingImages,
            newFiles,
            customFields,
        });
        onClose();
    }

    function updateCustomFieldValue(fieldKey, value) {
        setCustomFields((prev) => ({ ...prev, [fieldKey]: value }));
    }

    const customFieldByKey = (projectFields || []).reduce((acc, field) => {
        acc[field.field_key] = field;
        return acc;
    }, {});

    const fallbackOrder = [
        { field_key: 'description', field_name: 'Description', is_builtin: true },
        { field_key: 'location', field_name: 'Location', is_builtin: true },
        { field_key: 'inspection_type', field_name: 'Inspection Type', is_builtin: true },
        ...projectFields,
        { field_key: 'remarks', field_name: 'Remarks', is_builtin: true },
    ];

    const orderedEditable = ((orderedColumns && orderedColumns.length > 0) ? orderedColumns : fallbackOrder)
        .filter((col) => !['serial', 'status', 'attachments', 'actions'].includes(col.field_key));

    function renderFieldByColumn(col) {
        const key = col.field_key;
        const label = col.field_name || key;

        const labelStyle = {
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: 'var(--clr-text-main)',
            marginBottom: '0.5rem'
        };

        const inputStyle = {
            width: '100%',
            padding: '0.75rem 1rem',
            borderRadius: '10px',
            border: '1px solid var(--clr-border)',
            background: '#fff',
            fontSize: '0.95rem',
            fontFamily: 'inherit',
            outline: 'none',
            boxSizing: 'border-box',
        };

        if (key === 'description') {
            return (
                <div key={key} style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>
                        <FileText size={14} style={{ verticalAlign: '-2px', marginRight: '6px' }} />
                        {label}
                    </label>
                    <textarea
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        rows={4}
                        required
                        autoFocus
                        placeholder="Describe the inspection request..."
                        style={{ ...inputStyle, padding: '1rem', lineHeight: '1.6', resize: 'none' }}
                    />
                </div>
            );
        }

        if (key === 'location') {
            return (
                <div key={key}>
                    <label style={labelStyle}>
                        <MapPin size={14} style={{ verticalAlign: '-2px', marginRight: '6px' }} />
                        {label}
                    </label>
                    <input
                        value={location}
                        onChange={e => setLocation(e.target.value)}
                        required
                        placeholder="e.g. Floor 3, Zone A"
                        style={inputStyle}
                    />
                </div>
            );
        }

        if (key === 'inspection_type') {
            return (
                <div key={key}>
                    <label style={labelStyle}>
                        <Tag size={14} style={{ verticalAlign: '-2px', marginRight: '6px' }} />
                        {label}
                    </label>
                    <select
                        value={inspectionType}
                        onChange={e => setInspectionType(e.target.value)}
                        style={inputStyle}
                    >
                        {INSPECTION_TYPES.map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                </div>
            );
        }

        if (key === 'remarks') {
            return (
                <div key={key} style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>{label}</label>
                    <textarea
                        rows={3}
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        placeholder="Optional remarks"
                        style={{ ...inputStyle, padding: '0.9rem', resize: 'vertical' }}
                    />
                </div>
            );
        }

        const field = customFieldByKey[key];
        if (!field) return null;

        const value = customFields?.[key] || '';
        if (field.field_type === 'select') {
            return (
                <div key={key}>
                    <label style={labelStyle}>{label}</label>
                    <select
                        value={value}
                        onChange={(e) => updateCustomFieldValue(key, e.target.value)}
                        style={inputStyle}
                    >
                        <option value="">- Select -</option>
                        {(field.options || []).map((option) => (
                            <option key={option} value={option}>{option}</option>
                        ))}
                    </select>
                </div>
            );
        }

        if (field.field_type === 'textarea') {
            return (
                <div key={key} style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>{label}</label>
                    <textarea
                        rows={3}
                        value={value}
                        onChange={(e) => updateCustomFieldValue(key, e.target.value)}
                        style={{ ...inputStyle, padding: '0.9rem', resize: 'vertical' }}
                    />
                </div>
            );
        }

        const type = field.field_type === 'number' ? 'number' : field.field_type === 'date' ? 'date' : 'text';
        return (
            <div key={key}>
                <label style={labelStyle}>{label}</label>
                <input
                    type={type}
                    value={value}
                    onChange={(e) => updateCustomFieldValue(key, e.target.value)}
                    style={inputStyle}
                />
            </div>
        );
    }

    function getPreviewUrl(file) {
        if (typeof file === 'string') return file;
        return URL.createObjectURL(file);
    }

    function removeExistingImage(index) {
        setExistingImages(prev => prev.filter((_, i) => i !== index));
    }

    function removeNewFile(index) {
        setNewFiles(prev => prev.filter((_, i) => i !== index));
    }

    function replaceExistingImage(index, newFile) {
        setExistingImages(prev => prev.filter((_, i) => i !== index));
        setNewFiles(prev => [...prev, newFile]);
    }

    function replaceNewFile(index, newFile) {
        setNewFiles(prev => prev.map((f, i) => i === index ? newFile : f));
    }

    const markupImage = markupTarget
        ? markupTarget.source === 'existing'
            ? existingImages[markupTarget.index]
            : newFiles[markupTarget.index]
        : null;

    return (
        <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
            <div 
                className="modal-content" 
                onClick={(e) => e.stopPropagation()}
                style={{ 
                    maxWidth: '650px', 
                    width: '95%',
                    borderRadius: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    maxHeight: '90vh',
                    boxShadow: 'var(--shadow-float)',
                    overflow: 'hidden'
                }}
            >
                {/* Header - Matching RejectModal/RFIDetailModal style */}
                <div style={{
                    padding: '1.25rem 1.5rem',
                    borderBottom: '1px solid var(--clr-border)',
                    background: 'linear-gradient(180deg, #ffffff, #f8fafc)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            width: '40px', height: '40px', borderRadius: '10px',
                            background: 'var(--clr-info-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Pencil size={20} color="var(--clr-info)" />
                        </div>

                        {projectFields.length > 0 && (
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--clr-text-main)', marginBottom: '0.65rem' }}>
                                    Additional Fields
                                </label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    {projectFields.map((field) => {
                                        const value = customFields?.[field.field_key] || '';
                                        if (field.field_type === 'select') {
                                            return (
                                                <div key={field.id || field.field_key}>
                                                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--clr-text-secondary)', marginBottom: '0.35rem' }}>
                                                        {field.field_name}
                                                    </label>
                                                    <select
                                                        value={value}
                                                        onChange={(e) => updateCustomFieldValue(field.field_key, e.target.value)}
                                                        style={{
                                                            width: '100%', padding: '0.7rem 0.9rem', borderRadius: '10px',
                                                            border: '1px solid var(--clr-border)', background: '#fff',
                                                            fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none',
                                                            boxSizing: 'border-box'
                                                        }}
                                                    >
                                                        <option value="">- Select -</option>
                                                        {(field.options || []).map((option) => (
                                                            <option key={option} value={option}>{option}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            );
                                        }

                                        if (field.field_type === 'textarea') {
                                            return (
                                                <div key={field.id || field.field_key} style={{ gridColumn: '1 / -1' }}>
                                                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--clr-text-secondary)', marginBottom: '0.35rem' }}>
                                                        {field.field_name}
                                                    </label>
                                                    <textarea
                                                        rows={3}
                                                        value={value}
                                                        onChange={(e) => updateCustomFieldValue(field.field_key, e.target.value)}
                                                        style={{
                                                            width: '100%', padding: '0.8rem 0.9rem', borderRadius: '10px',
                                                            border: '1px solid var(--clr-border)', background: '#fff',
                                                            fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none',
                                                            boxSizing: 'border-box', resize: 'vertical'
                                                        }}
                                                    />
                                                </div>
                                            );
                                        }

                                        const type = field.field_type === 'number' ? 'number' : field.field_type === 'date' ? 'date' : 'text';
                                        return (
                                            <div key={field.id || field.field_key}>
                                                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--clr-text-secondary)', marginBottom: '0.35rem' }}>
                                                    {field.field_name}
                                                </label>
                                                <input
                                                    type={type}
                                                    value={value}
                                                    onChange={(e) => updateCustomFieldValue(field.field_key, e.target.value)}
                                                    style={{
                                                        width: '100%', padding: '0.7rem 0.9rem', borderRadius: '10px',
                                                        border: '1px solid var(--clr-border)', background: '#fff',
                                                        fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none',
                                                        boxSizing: 'border-box'
                                                    }}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--clr-text-main)' }}>
                                Edit Inspection
                            </h3>
                            <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: 'var(--clr-text-secondary)' }}>
                                RFI #{rfi.serialNo} &middot; Currently {rfi.status}
                            </p>
                        </div>
                    </div>
                    <button className="btn-close" onClick={onClose}>
                        <X size={20} color="var(--clr-text-secondary)" />
                    </button>
                </div>

                {/* Body */}
                <div style={{ 
                    padding: '1.5rem', 
                    overflowY: 'auto', 
                    flex: 1,
                    background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)' 
                }}>
                    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.5rem' }}>
                        
                        {/* Description */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--clr-text-main)', marginBottom: '0.5rem' }}>
                                <FileText size={14} style={{ verticalAlign: '-2px', marginRight: '6px' }} />
                                Description
                            </label>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                rows={4}
                                required
                                autoFocus
                                placeholder="Describe the inspection request..."
                                style={{
                                    width: '100%', padding: '1rem', borderRadius: '12px',
                                    border: '1px solid var(--clr-border)',
                                    background: '#fff',
                                    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.5rem' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                                            {orderedEditable.map((col) => renderFieldByColumn(col)).filter(Boolean)}
                                        </div>
                                            }} className="desktop-hover-only" onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                                                <button type="button" onClick={() => setMarkupTarget({ source: 'new', index: idx })}
                                                    style={{
                                                        width: '28px', height: '28px', borderRadius: '6px', border: 'none',
                                                        background: '#fff', color: 'var(--clr-text-main)', cursor: 'pointer',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    }}>
                                                    <Brush size={14} />
                                                </button>
                                                <button type="button" onClick={() => removeNewFile(idx)}
                                                    style={{
                                                        width: '28px', height: '28px', borderRadius: '6px', border: 'none',
                                                        background: '#fff', color: 'var(--clr-danger)', cursor: 'pointer',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    }}>
                                                    <X size={14} />
                                                </button>
                                            </div>
                                            <div style={{
                                                position: 'absolute', top: '-2px', right: '-2px',
                                                background: 'var(--clr-info)', color: 'white',
                                                fontSize: '8px', padding: '2px 4px', borderRadius: '4px',
                                                fontWeight: 800, textTransform: 'uppercase'
                                            }}>New</div>
                                        </div>
                                        {/* Mobile Persistent Controls */}
                                        <div className="mobile-only-flex" style={{ display: 'none', justifyContent: 'center', gap: '12px' }}>
                                            <button type="button" onClick={() => setMarkupTarget({ source: 'new', index: idx })}
                                                style={{ background: 'transparent', border: 'none', color: 'var(--clr-info)', padding: '4px' }}>
                                                <Brush size={18} />
                                            </button>
                                            <button type="button" onClick={() => removeNewFile(idx)}
                                                style={{ background: 'transparent', border: 'none', color: 'var(--clr-danger)', padding: '4px' }}>
                                                <X size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                <div 
                                    onClick={() => fileInputRef.current?.click()}
                                    style={{
                                        width: '90px', height: '90px', borderRadius: '10px',
                                        border: '1.5px dashed var(--clr-border)', display: 'flex',
                                        alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                                        background: 'rgba(248, 250, 252, 0.5)', transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--clr-text-muted)'; e.currentTarget.style.background = 'var(--clr-bg-hover)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--clr-border)'; e.currentTarget.style.background = 'rgba(248, 250, 252, 0.5)'; }}
                                >
                                    <Upload size={20} color="var(--clr-text-muted)" />
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div style={{
                    padding: '1.25rem 1.5rem',
                    borderTop: '1px solid var(--clr-border)',
                    background: '#fff',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '0.75rem',
                    borderRadius: '0 0 16px 16px'
                }}>
                    <button 
                        type="button" 
                        onClick={onClose}
                        className="btn"
                        style={{ 
                            background: 'transparent', 
                            color: 'var(--clr-text-secondary)',
                            border: '1px solid var(--clr-border)',
                            fontWeight: 600
                        }}
                    >
                        Discard Changes
                    </button>
                    <button 
                        type="button" 
                        onClick={handleSubmit}
                        disabled={!description.trim() || !location.trim()}
                        className="btn"
                        style={{ 
                            background: 'var(--clr-info)', 
                            color: 'white',
                            border: 'none',
                            fontWeight: 600,
                            padding: '0.6rem 1.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            opacity: (!description.trim() || !location.trim()) ? 0.6 : 1,
                            cursor: (!description.trim() || !location.trim()) ? 'not-allowed' : 'pointer'
                        }}
                    >
                        <Save size={16} /> Save Changes
                    </button>
                </div>
            </div>

            {/* Image Markup Modal */}
            {markupTarget && markupImage && (
                <ImageMarkupModal
                    image={markupImage}
                    onClose={() => setMarkupTarget(null)}
                    onSave={(annotatedFile) => {
                        if (markupTarget.source === 'existing') {
                            replaceExistingImage(markupTarget.index, annotatedFile);
                        } else {
                            replaceNewFile(markupTarget.index, annotatedFile);
                        }
                        setMarkupTarget(null);
                    }}
                />
            )}
        </div>
    );
}
