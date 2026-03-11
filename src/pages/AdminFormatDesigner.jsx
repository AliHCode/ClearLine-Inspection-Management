import { useEffect, useMemo, useState } from 'react';
import { FileText, Move, Save, RotateCcw, Image, Columns, Settings, Layers, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Header from '../components/Header';
import { useProject } from '../context/ProjectContext';

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 760;

const DEFAULT_TEMPLATE = {
    canvas: { width: 1200, height: 1600, showGrid: true, snapToGrid: true },
    elements: [
        { id: 'logo_l', type: 'image', role: 'leftLogo', x: 40, y: 40, w: 100, h: 60, rotation: 0, zIndex: 1, url: '' },
        { id: 'logo_m', type: 'image', role: 'middleLogo', x: 550, y: 40, w: 100, h: 60, rotation: 0, zIndex: 1, url: '' },
        { id: 'logo_r', type: 'image', role: 'rightLogo', x: 1060, y: 40, w: 100, h: 60, rotation: 0, zIndex: 1, url: '' },
        { id: 'title', type: 'text', role: 'title', x: 300, y: 35, w: 600, h: 45, rotation: 0, zIndex: 2, content: 'RFI Summary', styles: { fontSize: 32, fontWeight: 800, textAlign: 'center', color: '#000000' } },
        { id: 'subtitle', type: 'text', role: 'subtitle', x: 300, y: 85, w: 600, h: 25, rotation: 0, zIndex: 2, content: 'Construction of 05 Bridges at Sohar Buraimi Road.', styles: { fontSize: 16, fontWeight: 600, textAlign: 'center', color: '#000000' } },
        { id: 'project_line', type: 'text', role: 'projectLine', x: 40, y: 130, w: 1120, h: 30, rotation: 0, zIndex: 2, content: 'PROJECT: _________________________________________________________________', styles: { fontSize: 14, fontWeight: 700, textAlign: 'left', color: '#000000' } },
        { id: 'submission_date', type: 'text', role: 'submissionDate', x: 960, y: 130, w: 200, h: 20, rotation: 0, zIndex: 2, content: 'Submission Date: 07.03.2026', styles: { fontSize: 12, textAlign: 'right', color: '#000000' } },
        { id: 'table', type: 'table', role: 'table', x: 40, y: 190, w: 1120, h: 1000, rotation: 0, zIndex: 1 },
        { id: 'footer_l', type: 'text', role: 'footerLeft', x: 40, y: 1540, w: 300, h: 20, rotation: 0, zIndex: 2, content: 'Submitted By', styles: { fontSize: 14, fontWeight: 900, textAlign: 'left', color: '#000000' } },
        { id: 'footer_r', type: 'text', role: 'footerRight', x: 860, y: 1540, w: 300, h: 20, rotation: 0, zIndex: 2, content: 'Received By', styles: { fontSize: 14, fontWeight: 900, textAlign: 'right', color: '#000000' } },
    ],
    tableConfig: {
        headFillColor: '#5bb3d9',
        headTextColor: '#000000',
        bodyFontSize: 8,
        headFontSize: 8,
        groupedHeaders: [{ title: 'Chainage', fromKey: 'chainage_from', toKey: 'chainage_to' }],
        columnLabels: {},
    }
};

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function snap(value, grid, enabled) {
    if (!enabled) return value;
    return Math.round(value / grid) * grid;
}

export default function AdminFormatDesigner() {
    const { activeProject, orderedTableColumns, saveProjectExportTemplate } = useProject();
    const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
    const [saving, setSaving] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [zoom, setZoom] = useState(0.8);
    const [interaction, setInteraction] = useState(null);

    useEffect(() => {
        if (activeProject?.export_template) {
            setTemplate(prev => ({
                ...prev,
                ...activeProject.export_template,
                canvas: activeProject.export_template.canvas || prev.canvas,
                elements: activeProject.export_template.elements || prev.elements,
                tableConfig: activeProject.export_template.tableConfig || prev.tableConfig,
            }));
        }
    }, [activeProject?.id]);

    const previewColumns = useMemo(() => {
        return (orderedTableColumns || []).filter((c) => c.field_key !== 'actions');
    }, [orderedTableColumns]);

    const previewHeaderKeys = useMemo(() => previewColumns.map((c) => c.field_key), [previewColumns]);
    
    const updateElement = (id, patch) => {
        setTemplate(prev => ({
            ...prev,
            elements: prev.elements.map(el => el.id === id ? { ...el, ...patch } : el)
        }));
    };

    const updateElementStyle = (id, stylePatch) => {
        setTemplate(prev => ({
            ...prev,
            elements: prev.elements.map(el => el.id === id ? { ...el, styles: { ...el.styles, ...stylePatch } } : el)
        }));
    };

    const addElement = (type, patch = {}) => {
        const id = `${type}_${Date.now()}`;
        const newEl = {
            id,
            type,
            x: 100, y: 100,
            w: type === 'text' ? 200 : 100,
            h: type === 'text' ? 40 : 100,
            rotation: 0,
            zIndex: template.elements.length + 1,
            styles: type === 'text' ? { fontSize: 14, color: '#000000' } : { background: '#cccccc' },
            content: type === 'text' ? 'New Text' : '',
            ...patch
        };
        setTemplate(prev => ({ ...prev, elements: [...prev.elements, newEl] }));
        setSelectedId(id);
    };

    const deleteElement = (id) => {
        setTemplate(prev => ({
            ...prev,
            elements: prev.elements.filter(el => el.id !== id)
        }));
        if (selectedId === id) setSelectedId(null);
    };

    const duplicateElement = (id) => {
        const el = template.elements.find(e => e.id === id);
        if (!el) return;
        const newId = `${el.type}_${Date.now()}`;
        setTemplate(prev => ({
            ...prev,
            elements: [...prev.elements, { ...el, id: newId, x: el.x + 20, y: el.y + 20, zIndex: prev.elements.length + 1 }]
        }));
        setSelectedId(newId);
    };

    const bringToFront = (id) => {
        const maxZ = Math.max(...template.elements.map(e => e.zIndex || 0), 0);
        updateElement(id, { zIndex: maxZ + 1 });
    };

    const sendToBack = (id) => {
        const minZ = Math.min(...template.elements.map(e => e.zIndex || 0), 0);
        updateElement(id, { zIndex: minZ - 1 });
    };

    const previewHeaderNameMap = useMemo(() => {
        const map = {};
        previewColumns.forEach((c) => {
            map[c.field_key] = template.tableConfig.columnLabels?.[c.field_key] || c.field_name;
        });
        return map;
    }, [previewColumns, template.tableConfig.columnLabels]);

        const previewGroupedHeaders = useMemo(() => {
        return (template.tableConfig.groupedHeaders || [])
            .map((g) => {
                const start = previewHeaderKeys.indexOf(g.fromKey);
                const end = previewHeaderKeys.indexOf(g.toKey);
                if (start < 0 || end < 0 || end <= start) return null;
                return { ...g, start, end, span: end - start + 1 };
            })
            .filter(Boolean)
            .sort((a, b) => a.start - b.start);
    }, [template.tableConfig.groupedHeaders, previewHeaderKeys]);

    function startInteraction(e, id, mode, handle = null) {
        e.preventDefault();
        e.stopPropagation();
        setSelectedId(id);
        const el = template.elements.find(e => e.id === id);
        if (!el) return;
        setInteraction({
            id,
            mode,
            handle,
            startX: e.clientX,
            startY: e.clientY,
            startRect: { ...el }
        });
    }

    useEffect(() => {
        if (!interaction) return;

        function onMouseMove(e) {
            const dx = (e.clientX - interaction.startX) / zoom;
            const dy = (e.clientY - interaction.startY) / zoom;
            const grid = template.canvas.snapToGrid ? 8 : 1;
            const el = interaction.startRect;

            if (interaction.mode === 'move') {
                updateElement(interaction.id, {
                    x: snap(el.x + dx, grid, true),
                    y: snap(el.y + dy, grid, true)
                });
            } else if (interaction.mode === 'resize') {
                const h = interaction.handle;
                let { x, y, w, h: height } = el;
                
                if (h.includes('e')) w = snap(el.w + dx, grid, true);
                if (h.includes('s')) height = snap(el.h + dy, grid, true);
                if (h.includes('w')) {
                    const nextW = snap(el.w - dx, grid, true);
                    if (nextW > 10) { x = snap(el.x + (el.w - nextW), grid, true); w = nextW; }
                }
                if (h.includes('n')) {
                    const nextH = snap(el.h - dy, grid, true);
                    if (nextH > 10) { y = snap(el.y + (el.h - nextH), grid, true); height = nextH; }
                }
                updateElement(interaction.id, { x, y, w, h: height });
            } else if (interaction.mode === 'rotate') {
                const rect = document.getElementById(el_ + interaction.id).getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI) + 90;
                updateElement(interaction.id, { rotation: Math.round(angle / 5) * 5 });
            }
        }

        function onMouseUp() { setInteraction(null); }
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
    }, [interaction, zoom, template.canvas.snapToGrid]);

    const handleSave = async () => {
        setSaving(true);
        const result = await saveProjectExportTemplate(template);
        setSaving(false);
        if (result?.success) toast.success('Studio layout saved');
        else toast.error(result?.error || 'Save failed');
    };

    const selectedElement = template.elements.find(el => el.id === selectedId);

    return (
        <div className="studio-v2-container">
            <aside className="studio-left-sidebar">
                <header className="inspector-header">
                    <h3 className="text-xs font-bold flex items-center gap-2 text-emerald-500 uppercase tracking-widest"><Layers size={14} /> Elements</h3>
                </header>
                
                <div className="library-section">
                    <h4>Basic Shapes</h4>
                    <div className="library-grid">
                        <div className="library-item" onClick={() => addElement('text', { content: 'New Heading', styles: { fontSize: 24, fontWeight: 700 } })}>
                            <FileText size={20} />
                            <span>Text</span>
                        </div>
                        <div className="library-item" onClick={() => addElement('image', { w: 150, h: 100 })}>
                            <Image size={20} />
                            <span>Image</span>
                        </div>
                        <div className="library-item" onClick={() => addElement('shape', { type: 'rectangle', w: 200, h: 100, styles: { background: '#ffffff', border: '1px solid #001' } })}>
                            <Move size={20} />
                            <span>Box</span>
                        </div>
                    </div>
                </div>

                <div className="library-section">
                    <h4>Special Blocks</h4>
                    <div className="library-grid">
                        <div className="library-item" onClick={() => addElement('table', { role: 'table' })}>
                            <Columns size={20} />
                            <span>RFI Table</span>
                        </div>
                    </div>
                </div>

                <div className="mt-auto p-4 space-y-3 border-t border-studio-border">
                    <button className="terminal-btn w-full justify-center" onClick={() => setTemplate(DEFAULT_TEMPLATE)}><RotateCcw size={14} /> Reset</button>
                    <button className="terminal-btn primary w-full justify-center" onClick={handleSave} disabled={saving}><Save size={14} /> {saving ? 'Saving...' : 'Deploy Template'}</button>
                </div>
            </aside>

            <main className="studio-center-stage" onClick={() => setSelectedId(null)}>
                <div 
                    className="studio-terminal-canvas"
                    style={{
                        width: template.canvas.width + 'px',
                        height: template.canvas.height + 'px',
                        transform: 'scale(' + zoom + ')',
                        transformOrigin: 'top center',
                        border: '1px solid #000',
                        background: '#fff',
                        boxShadow: '0 30px 60px rgba(0,0,0,0.4)',
                        position: 'relative'
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {template.canvas.showGrid && (
                        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(0,0,0,0.1) 1px, transparent 1px)', backgroundSize: '20px 20px', pointerEvents: 'none' }} />
                    )}

                    {template.elements.slice().sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0)).map(el => (
                        <div
                            key={el.id}
                            id={'el_' + el.id}
                            className="studio-v2-element"
                            onMouseDown={(e) => startInteraction(e, el.id, 'move')}
                            style={{
                                left: el.x + 'px',
                                top: el.y + 'px',
                                width: el.w + 'px',
                                height: el.h + 'px',
                                transform: 'rotate(' + (el.rotation || 0) + 'deg)',
                                zIndex: el.zIndex || 1,
                                outline: selectedId === el.id ? '2px solid #10b981' : 'none',
                                cursor: 'move'
                            }}
                        >
                            <div style={{ width: '100%', height: '100%', ...el.styles, overflow: 'hidden' }}>
                                {el.type === 'text' && (
                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: el.styles?.textAlign || 'center', whiteSpace: 'pre-wrap' }}>
                                        {el.content}
                                    </div>
                                )}
                                {el.type === 'image' && (
                                    <img src={el.url || '/dashboardlogo.png'} style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} />
                                )}
                                {el.type === 'table' && (
                                    <div style={{ width: '100%', height: '100%', border: '1px solid #000' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
                                            <thead style={{ background: template.tableConfig.headFillColor }}>
                                                <tr>{previewColumns.slice(0, 8).map(c => <th key={c.field_key} style={{ border: '1px solid #000', padding: '4px' }}>{c.field_name}</th>)}</tr>
                                            </thead>
                                            <tbody>
                                                {[1,2,3,4,5].map(r => <tr key={r}>{previewColumns.slice(0, 8).map(c => <td key={c.field_key} style={{ border: '1px solid #000', padding: '4px' }}>&nbsp;</td>)}</tr>)}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {selectedId === el.id && (
                                <>
                                    <div className="handle handle-nw" onMouseDown={(e) => startInteraction(e, el.id, 'resize', 'nw')} />
                                    <div className="handle handle-n" onMouseDown={(e) => startInteraction(e, el.id, 'resize', 'n')} />
                                    <div className="handle handle-ne" onMouseDown={(e) => startInteraction(e, el.id, 'resize', 'ne')} />
                                    <div className="handle handle-w" onMouseDown={(e) => startInteraction(e, el.id, 'resize', 'w')} />
                                    <div className="handle handle-e" onMouseDown={(e) => startInteraction(e, el.id, 'resize', 'e')} />
                                    <div className="handle handle-sw" onMouseDown={(e) => startInteraction(e, el.id, 'resize', 'sw')} />
                                    <div className="handle handle-s" onMouseDown={(e) => startInteraction(e, el.id, 'resize', 's')} />
                                    <div className="handle handle-se" onMouseDown={(e) => startInteraction(e, el.id, 'resize', 'se')} />
                                    <div className="handle-rotate" onMouseDown={(e) => startInteraction(e, el.id, 'rotate')}><RotateCcw size={12} /></div>
                                </>
                            )}
                        </div>
                    ))}
                </div>

                <div className="canvas-zoom-controls">
                    <button onClick={() => setZoom(Math.max(0.1, zoom - 0.1))}>-</button>
                    <span className="text-[10px] font-mono w-12 text-center">{Math.round(zoom * 100)}%</span>
                    <button onClick={() => setZoom(Math.min(2, zoom + 0.1))}>+</button>
                </div>
            </main>

            <aside className="studio-right-sidebar">
                <header className="inspector-header">
                    <h3 className="text-xs font-bold flex items-center gap-2 text-emerald-500 uppercase tracking-widest"><Settings size={14} /> Inspector</h3>
                </header>

                <div className="inspector-content">
                    {selectedElement ? (
                        <>
                            <div className="inspector-section">
                                <h4>Transform</h4>
                                <div className="grid grid-cols-2 gap-3 mb-3">
                                    <div className="studio-input-box">
                                        <label>X Pos</label>
                                        <input type="number" value={Math.round(selectedElement.x)} onChange={(e) => updateElement(selectedId, { x: Number(e.target.value) })} />
                                    </div>
                                    <div className="studio-input-box">
                                        <label>Y Pos</label>
                                        <input type="number" value={Math.round(selectedElement.y)} onChange={(e) => updateElement(selectedId, { y: Number(e.target.value) })} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="studio-input-box">
                                        <label>Width</label>
                                        <input type="number" value={Math.round(selectedElement.w)} onChange={(e) => updateElement(selectedId, { w: Number(e.target.value) })} />
                                    </div>
                                    <div className="studio-input-box">
                                        <label>Height</label>
                                        <input type="number" value={Math.round(selectedElement.h)} onChange={(e) => updateElement(selectedId, { h: Number(e.target.value) })} />
                                    </div>
                                </div>
                            </div>

                            {selectedElement.type === 'text' && (
                                <div className="inspector-section">
                                    <h4>Typography</h4>
                                    <div className="studio-input-box mb-3">
                                        <label>Content</label>
                                        <textarea value={selectedElement.content} onChange={(e) => updateElement(selectedId, { content: e.target.value })} rows={3} style={{ width: '100%', background: '#0d1117', border: '1px solid #30363d', color: '#fff', padding: '8px', fontSize: '0.8rem' }} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                        <div className="studio-input-box">
                                            <label>Size</label>
                                            <input type="number" value={selectedElement.styles?.fontSize || 14} onChange={(e) => updateElementStyle(selectedId, { fontSize: Number(e.target.value) })} />
                                        </div>
                                        <div className="studio-input-box">
                                            <label>Color</label>
                                            <input type="color" value={selectedElement.styles?.color || '#000000'} onChange={(e) => updateElementStyle(selectedId, { color: e.target.value })} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="inspector-section pt-6 border-t border-studio-border">
                                <h4>Actions</h4>
                                <div className="grid grid-cols-2 gap-2 mb-2">
                                    <button className="terminal-btn flex-1 justify-center" onClick={() => bringToFront(selectedId)}>Front</button>
                                    <button className="terminal-btn flex-1 justify-center" onClick={() => sendToBack(selectedId)}>Back</button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <button className="terminal-btn flex-1 justify-center" onClick={() => duplicateElement(selectedId)}>Clone</button>
                                    <button className="terminal-btn flex-1 justify-center text-red-500" onClick={() => deleteElement(selectedId)}>Delete</button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64 opacity-20"><Layers size={48} /></div>
                    )}
                </div>
            </aside>
        </div>
    );
}