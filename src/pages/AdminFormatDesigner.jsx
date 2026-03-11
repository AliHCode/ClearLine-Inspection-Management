import { useEffect, useMemo, useState } from 'react';
import { ImagePlus, Save, RotateCcw, FileText, Palette } from 'lucide-react';
import toast from 'react-hot-toast';
import Header from '../components/Header';
import { useProject } from '../context/ProjectContext';

const DEFAULT_TEMPLATE = {
    header: {
        title: 'RFI Summary',
        subtitle: '',
        projectLine: '',
        showSubmissionDate: true,
        leftLogoUrl: '',
        rightLogoUrl: '',
    },
    table: {
        headFillColor: '#5bb3d9',
        headTextColor: '#0b1f33',
        bodyFontSize: 8,
        headFontSize: 8,
        compactMode: false,
        groupedHeaders: [],
    },
    footer: {
        leftLabel: 'Contractor Representative',
        rightLabel: 'Consultant Representative',
        showFooter: true,
    },
};

function mergeTemplate(base, incoming) {
    return {
        header: { ...base.header, ...(incoming?.header || {}) },
        table: { ...base.table, ...(incoming?.table || {}) },
        footer: { ...base.footer, ...(incoming?.footer || {}) },
    };
}

export default function AdminFormatDesigner() {
    const { activeProject, orderedTableColumns, saveProjectExportTemplate } = useProject();
    const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setTemplate(mergeTemplate(DEFAULT_TEMPLATE, activeProject?.export_template || {}));
    }, [activeProject?.id, activeProject?.export_template]);

    const previewColumns = useMemo(() => {
        const visible = (orderedTableColumns || []).filter((c) => c.field_key !== 'actions');
        return visible.slice(0, 8);
    }, [orderedTableColumns]);

    const previewHeaderKeys = useMemo(() => previewColumns.map((c) => c.field_key), [previewColumns]);

    const previewGroupedHeaders = useMemo(() => {
        const groups = template.table.groupedHeaders || [];
        return groups
            .map((g) => {
                const start = previewHeaderKeys.indexOf(g.fromKey);
                const end = previewHeaderKeys.indexOf(g.toKey);
                if (start < 0 || end < 0 || end <= start) return null;
                return { ...g, start, end, span: end - start + 1 };
            })
            .filter(Boolean)
            .sort((a, b) => a.start - b.start);
    }, [template.table.groupedHeaders, previewHeaderKeys]);

    function updateSection(section, key, value) {
        setTemplate((prev) => ({
            ...prev,
            [section]: {
                ...prev[section],
                [key]: value,
            },
        }));
    }

    function addGroupedHeader() {
        const cols = previewColumns;
        if (cols.length < 2) {
            toast.error('Need at least 2 columns for a grouped header.');
            return;
        }

        const fromKey = cols[0].field_key;
        const toKey = cols[Math.min(1, cols.length - 1)].field_key;
        setTemplate((prev) => ({
            ...prev,
            table: {
                ...prev.table,
                groupedHeaders: [
                    ...(prev.table.groupedHeaders || []),
                    { title: 'New Group', fromKey, toKey },
                ],
            },
        }));
    }

    function updateGroupedHeader(index, key, value) {
        setTemplate((prev) => {
            const next = [...(prev.table.groupedHeaders || [])];
            next[index] = { ...next[index], [key]: value };
            return {
                ...prev,
                table: {
                    ...prev.table,
                    groupedHeaders: next,
                },
            };
        });
    }

    function removeGroupedHeader(index) {
        setTemplate((prev) => ({
            ...prev,
            table: {
                ...prev.table,
                groupedHeaders: (prev.table.groupedHeaders || []).filter((_, i) => i !== index),
            },
        }));
    }

    async function handleFileToDataUrl(file, sectionKey) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => updateSection('header', sectionKey, String(reader.result || ''));
        reader.readAsDataURL(file);
    }

    async function handleSave() {
        if (!activeProject?.id) {
            toast.error('Select a project first.');
            return;
        }

        setSaving(true);
        const result = await saveProjectExportTemplate(template);
        setSaving(false);

        if (!result?.success) {
            toast.error(result?.error || 'Failed to save template');
            return;
        }

        toast.success('Project export format saved');
    }

    function handleReset() {
        setTemplate(mergeTemplate(DEFAULT_TEMPLATE, {}));
    }

    return (
        <div className="page-wrapper">
            <Header />
            <main className="admin-page">
                <div className="sheet-header">
                    <div>
                        <h1><FileText size={24} /> Project Export Format</h1>
                        <p className="subtitle" style={{ marginTop: '0.25rem' }}>
                            One format per project. This format is shared by contractor and consultant exports.
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.6rem' }}>
                        <button className="btn btn-ghost btn-sm" onClick={handleReset}>
                            <RotateCcw size={15} /> Reset
                        </button>
                        <button className="btn btn-sm" onClick={handleSave} disabled={saving} style={{ background: 'var(--clr-brand-secondary)', color: '#fff', border: 'none' }}>
                            <Save size={15} /> {saving ? 'Saving...' : 'Save Format'}
                        </button>
                    </div>
                </div>

                <div className="admin-section" style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '1rem' }}>
                    <section style={{ background: '#fff', border: '1px solid var(--clr-border)', borderRadius: '12px', padding: '1rem' }}>
                        <h3 style={{ marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <ImagePlus size={16} /> Header and Branding
                        </h3>

                        <div className="admin-inline-form" style={{ display: 'grid', gap: '0.65rem' }}>
                            <input
                                type="text"
                                value={template.header.title}
                                placeholder="Title"
                                onChange={(e) => updateSection('header', 'title', e.target.value)}
                            />
                            <input
                                type="text"
                                value={template.header.subtitle}
                                placeholder="Subtitle"
                                onChange={(e) => updateSection('header', 'subtitle', e.target.value)}
                            />
                            <input
                                type="text"
                                value={template.header.projectLine}
                                placeholder="Project line"
                                onChange={(e) => updateSection('header', 'projectLine', e.target.value)}
                            />
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}>
                                <input
                                    type="checkbox"
                                    checked={template.header.showSubmissionDate}
                                    onChange={(e) => updateSection('header', 'showSubmissionDate', e.target.checked)}
                                />
                                Show submission date on top-right
                            </label>

                            <input
                                type="text"
                                value={template.header.leftLogoUrl}
                                placeholder="Left logo URL"
                                onChange={(e) => updateSection('header', 'leftLogoUrl', e.target.value)}
                            />
                            <label style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>
                                Upload left logo (stores as data URL)
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleFileToDataUrl(e.target.files?.[0], 'leftLogoUrl')}
                                    style={{ display: 'block', marginTop: '0.2rem' }}
                                />
                            </label>

                            <input
                                type="text"
                                value={template.header.rightLogoUrl}
                                placeholder="Right logo URL"
                                onChange={(e) => updateSection('header', 'rightLogoUrl', e.target.value)}
                            />
                            <label style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>
                                Upload right logo (stores as data URL)
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleFileToDataUrl(e.target.files?.[0], 'rightLogoUrl')}
                                    style={{ display: 'block', marginTop: '0.2rem' }}
                                />
                            </label>
                        </div>

                        <h3 style={{ margin: '1rem 0 0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Palette size={16} /> Table Styling
                        </h3>
                        <div className="admin-inline-form" style={{ display: 'grid', gap: '0.65rem' }}>
                            <label style={{ display: 'grid', gap: '0.2rem', fontSize: '0.85rem' }}>
                                Header fill color
                                <input
                                    type="color"
                                    value={template.table.headFillColor}
                                    onChange={(e) => updateSection('table', 'headFillColor', e.target.value)}
                                />
                            </label>
                            <label style={{ display: 'grid', gap: '0.2rem', fontSize: '0.85rem' }}>
                                Header text color
                                <input
                                    type="color"
                                    value={template.table.headTextColor}
                                    onChange={(e) => updateSection('table', 'headTextColor', e.target.value)}
                                />
                            </label>
                            <label style={{ display: 'grid', gap: '0.2rem', fontSize: '0.85rem' }}>
                                Header font size
                                <input
                                    type="number"
                                    min={7}
                                    max={14}
                                    value={template.table.headFontSize}
                                    onChange={(e) => updateSection('table', 'headFontSize', Number(e.target.value || 8))}
                                />
                            </label>
                            <label style={{ display: 'grid', gap: '0.2rem', fontSize: '0.85rem' }}>
                                Body font size
                                <input
                                    type="number"
                                    min={7}
                                    max={13}
                                    value={template.table.bodyFontSize}
                                    onChange={(e) => updateSection('table', 'bodyFontSize', Number(e.target.value || 8))}
                                />
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}>
                                <input
                                    type="checkbox"
                                    checked={template.table.compactMode}
                                    onChange={(e) => updateSection('table', 'compactMode', e.target.checked)}
                                />
                                Compact mode (more columns per page)
                            </label>
                        </div>

                        <h3 style={{ margin: '1rem 0 0.8rem' }}>Grouped Header Rows</h3>
                        <p className="text-muted" style={{ fontSize: '0.82rem', marginBottom: '0.6rem' }}>
                            Create merged header blocks (example: Chainage spanning From and To).
                        </p>
                        <div style={{ display: 'grid', gap: '0.6rem' }}>
                            {(template.table.groupedHeaders || []).length === 0 && (
                                <div style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)' }}>No grouped headers added.</div>
                            )}
                            {(template.table.groupedHeaders || []).map((group, idx) => (
                                <div key={`group_${idx}`} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '0.45rem', alignItems: 'center' }}>
                                    <input
                                        type="text"
                                        value={group.title || ''}
                                        placeholder="Group title"
                                        onChange={(e) => updateGroupedHeader(idx, 'title', e.target.value)}
                                    />
                                    <select value={group.fromKey || ''} onChange={(e) => updateGroupedHeader(idx, 'fromKey', e.target.value)}>
                                        {previewColumns.map((c) => <option key={`from_${idx}_${c.field_key}`} value={c.field_key}>{c.field_name}</option>)}
                                    </select>
                                    <select value={group.toKey || ''} onChange={(e) => updateGroupedHeader(idx, 'toKey', e.target.value)}>
                                        {previewColumns.map((c) => <option key={`to_${idx}_${c.field_key}`} value={c.field_key}>{c.field_name}</option>)}
                                    </select>
                                    <button className="btn btn-sm btn-ghost" onClick={() => removeGroupedHeader(idx)} style={{ color: 'var(--clr-danger)' }}>
                                        Remove
                                    </button>
                                </div>
                            ))}
                            <div>
                                <button className="btn btn-sm btn-ghost" onClick={addGroupedHeader}>Add Grouped Header</button>
                            </div>
                        </div>

                        <h3 style={{ margin: '1rem 0 0.8rem' }}>Footer</h3>
                        <div className="admin-inline-form" style={{ display: 'grid', gap: '0.65rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}>
                                <input
                                    type="checkbox"
                                    checked={template.footer.showFooter}
                                    onChange={(e) => updateSection('footer', 'showFooter', e.target.checked)}
                                />
                                Show signature footer
                            </label>
                            <input
                                type="text"
                                value={template.footer.leftLabel}
                                placeholder="Left signature label"
                                onChange={(e) => updateSection('footer', 'leftLabel', e.target.value)}
                            />
                            <input
                                type="text"
                                value={template.footer.rightLabel}
                                placeholder="Right signature label"
                                onChange={(e) => updateSection('footer', 'rightLabel', e.target.value)}
                            />
                        </div>
                    </section>

                    <section style={{ background: '#fff', border: '1px solid var(--clr-border)', borderRadius: '12px', padding: '1rem' }}>
                        <h3 style={{ marginBottom: '0.8rem' }}>Live Preview</h3>
                        <div style={{ border: '1px solid #0f172a', borderRadius: '8px', overflow: 'hidden' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: '#fff' }}>
                                <img src={template.header.leftLogoUrl || '/dashboardlogo.png'} alt="Left logo" style={{ height: '34px', maxWidth: '120px', objectFit: 'contain' }} />
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{template.header.title || 'RFI Summary'}</div>
                                    <div style={{ fontSize: '0.85rem' }}>{template.header.subtitle}</div>
                                    <div style={{ fontSize: '0.78rem', color: '#475569' }}>{template.header.projectLine || activeProject?.name}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <img src={template.header.rightLogoUrl || '/dashboardlogo.png'} alt="Right logo" style={{ height: '34px', maxWidth: '120px', objectFit: 'contain' }} />
                                    {template.header.showSubmissionDate && (
                                        <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>Submission Date: DD.MM.YYYY</div>
                                    )}
                                </div>
                            </div>

                            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                                <thead>
                                    {previewGroupedHeaders.length > 0 && (
                                        <tr style={{ background: template.table.headFillColor, color: template.table.headTextColor }}>
                                            {(() => {
                                                const cells = [];
                                                let idx = 0;
                                                while (idx < previewColumns.length) {
                                                    const group = previewGroupedHeaders.find((g) => g.start === idx);
                                                    if (group) {
                                                        cells.push(
                                                            <th key={`grp_${idx}`} colSpan={group.span} style={{ border: '1px solid #0f172a', padding: '0.35rem', fontSize: `${template.table.headFontSize}px` }}>
                                                                {group.title || 'Group'}
                                                            </th>
                                                        );
                                                        idx += group.span;
                                                    } else {
                                                        cells.push(
                                                            <th key={`solo_${idx}`} rowSpan={2} style={{ border: '1px solid #0f172a', padding: '0.35rem', fontSize: `${template.table.headFontSize}px` }}>
                                                                {previewColumns[idx].field_name}
                                                            </th>
                                                        );
                                                        idx += 1;
                                                    }
                                                }
                                                return cells;
                                            })()}
                                        </tr>
                                    )}
                                    <tr style={{ background: template.table.headFillColor, color: template.table.headTextColor }}>
                                        {previewColumns
                                            .filter((col) => previewGroupedHeaders.some((g) => {
                                                const index = previewHeaderKeys.indexOf(col.field_key);
                                                return index >= g.start && index <= g.end;
                                            }))
                                            .map((col) => (
                                                <th key={col.field_key} style={{ border: '1px solid #0f172a', padding: '0.35rem', fontSize: `${template.table.headFontSize}px` }}>
                                                    {col.field_name}
                                                </th>
                                            ))}
                                        {previewGroupedHeaders.length === 0 && previewColumns.map((col) => (
                                            <th key={col.field_key} style={{ border: '1px solid #0f172a', padding: '0.35rem', fontSize: `${template.table.headFontSize}px` }}>
                                                {col.field_name}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        {previewColumns.map((col) => (
                                            <td key={col.field_key} style={{ border: '1px solid #0f172a', padding: '0.35rem', fontSize: `${template.table.bodyFontSize}px` }}>
                                                Sample {col.field_name}
                                            </td>
                                        ))}
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <p className="text-muted" style={{ marginTop: '0.8rem', fontSize: '0.83rem' }}>
                            This layout will be used by both PDF and Excel exports for this project. For Excel, image URLs are included in header text rows.
                        </p>
                    </section>
                </div>
            </main>
        </div>
    );
}
