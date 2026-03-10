import { useEffect, useRef, useState } from 'react';
import { X, Undo2, RotateCcw, Save, MousePointer2 } from 'lucide-react';

export default function ImageMarkupModal({ image, onSave, onClose }) {
    const canvasRef = useRef(null);
    const historyRef = useRef([]);
    const [drawing, setDrawing] = useState(false);
    const [brushSize, setBrushSize] = useState(8); // Increased default
    const [brushColor, setBrushColor] = useState('#ef4444');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!image || !canvasRef.current) return;

        let objectUrl = null;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const img = new Image();

        if (typeof image === 'string') {
            img.src = image;
        } else {
            objectUrl = URL.createObjectURL(image);
            img.src = objectUrl;
        }

        img.onload = () => {
            // Keep a reasonable resolution but ensure it fits
            const maxWidth = 1200; 
            const scale = Math.min(1, maxWidth / img.width);
            canvas.width = Math.floor(img.width * scale);
            canvas.height = Math.floor(img.height * scale);

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            historyRef.current = [ctx.getImageData(0, 0, canvas.width, canvas.height)];
            setLoading(false);
        };

        return () => {
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [image]);

    const pointFromEvent = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        
        // Handle touch vs mouse
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        // CRITICAL FIX: Normalize coordinates based on canvas display scale
        // This solves the 'drawing offset' issue where drawing is shifted from cursor
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY,
        };
    };

    const beginDraw = (e) => {
        if (!canvasRef.current || loading) return;
        
        // Prevent scrolling while drawing on mobile
        if (e.cancelable) e.preventDefault();

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const { x, y } = pointFromEvent(e);

        historyRef.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        
        // Brush settings
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = brushSize;
        ctx.strokeStyle = brushColor;
        
        // "Weight" / Visibility effect: Add a subtle glow/shadow to make it stand out
        ctx.shadowBlur = brushSize / 4;
        ctx.shadowColor = brushColor;
        
        setDrawing(true);
    };

    const draw = (e) => {
        if (!drawing || !canvasRef.current) return;
        if (e.cancelable) e.preventDefault();

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const { x, y } = pointFromEvent(e);

        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const endDraw = () => {
        if (!drawing) return;
        setDrawing(false);
        
        // Close path and reset shadow for clean state
        const ctx = canvasRef.current.getContext('2d');
        ctx.beginPath();
        ctx.shadowBlur = 0;
    };

    const undo = () => {
        const canvas = canvasRef.current;
        if (!canvas || historyRef.current.length <= 1) return;

        historyRef.current.pop();
        const previous = historyRef.current[historyRef.current.length - 1];
        const ctx = canvas.getContext('2d');
        ctx.putImageData(previous, 0, 0);
    };

    const resetMarkup = () => {
        const canvas = canvasRef.current;
        if (!canvas || historyRef.current.length === 0) return;

        const firstState = historyRef.current[0];
        const ctx = canvas.getContext('2d');
        ctx.putImageData(firstState, 0, 0);
        historyRef.current = [firstState];
    };

    const saveMarkup = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.toBlob((blob) => {
            if (!blob) return;
            const name = image instanceof File ? image.name.replace(/\.[^.]+$/, '') : 'annotated-image';
            const file = new File([blob], `${name}-marked.png`, { type: 'image/png' });
            onSave(file);
        }, 'image/png', 0.95); // Slightly higher quality
    };

    return (
        <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1200 }}>
            <div 
                className="modal-content" 
                onClick={(e) => e.stopPropagation()}
                style={{
                    maxWidth: '1000px',
                    width: '95%',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    maxHeight: '94vh',
                    boxShadow: 'var(--shadow-float)',
                    background: '#fff'
                }}
            >
                {/* Header */}
                <div style={{
                    padding: '1.25rem 1.5rem',
                    borderBottom: '1px solid var(--clr-border)',
                    background: 'linear-gradient(180deg, #ffffff, #f8fafc)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                        <div style={{
                            width: '40px', height: '40px', borderRadius: '10px',
                            background: 'var(--clr-accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0
                        }}>
                            <MousePointer2 size={20} color="var(--clr-accent)" />
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--clr-text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                Image Markup
                            </h3>
                            <p className="desktop-only" style={{ margin: '2px 0 0', fontSize: '0.85rem', color: 'var(--clr-text-secondary)' }}>
                                Draw to highlight specific areas or issues
                            </p>
                        </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <button 
                            onClick={saveMarkup} 
                            className="btn btn-primary"
                            style={{ 
                                padding: '0.5rem 1rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                fontWeight: 600,
                                fontSize: '0.85rem'
                            }}
                        >
                            <Save size={16} /> <span className="desktop-only">Save Markup</span><span className="mobile-only">Save</span>
                        </button>
                        <button className="btn-close" onClick={onClose} style={{ flexShrink: 0 }}>
                            <X size={20} color="var(--clr-text-secondary)" />
                        </button>
                    </div>
                </div>

                {/* Toolbar */}
                <div style={{
                    padding: '0.75rem 1.5rem',
                    borderBottom: '1px solid var(--clr-border)',
                    background: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.75rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {/* Brush Size */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--clr-text-secondary)' }}>Size</span>
                            <input
                                type="range"
                                min="2"
                                max="32"
                                value={brushSize}
                                onChange={(e) => setBrushSize(Number(e.target.value))}
                                style={{
                                    width: '80px',
                                    accentColor: brushColor,
                                    cursor: 'pointer'
                                }}
                            />
                        </div>

                        {/* Colors */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            {['#ef4444', '#22c55e', '#3b82f6', '#eab308', '#ffffff', '#000000'].map(color => (
                                <button
                                    key={color}
                                    onClick={() => setBrushColor(color)}
                                    style={{
                                        width: '22px',
                                        height: '22px',
                                        borderRadius: '50%',
                                        background: color,
                                        border: brushColor === color ? '2px solid #1e293b' : '1.5px solid #e2e8f0',
                                        cursor: 'pointer',
                                        padding: 0,
                                        boxShadow: 'var(--shadow-sm)'
                                    }}
                                />
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button className="btn btn-sm btn-ghost" onClick={undo} style={{ padding: '4px 8px', gap: '0.3rem', fontWeight: 600 }}>
                            <Undo2 size={14} /> <span className="desktop-only">Undo</span>
                        </button>
                        <button className="btn btn-sm btn-ghost" onClick={resetMarkup} style={{ padding: '4px 8px', gap: '0.3rem', fontWeight: 600 }}>
                            <RotateCcw size={14} /> <span className="desktop-only">Reset</span>
                        </button>
                    </div>
                </div>

                {/* Canvas Area */}
                <div style={{ 
                    flex: 1, 
                    padding: '1rem', 
                    background: '#f1f5f9', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    overflow: 'auto',
                }}>
                    <div style={{
                        background: '#fff',
                        boxShadow: 'var(--shadow-lg)',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        position: 'relative',
                        display: 'inline-block'
                    }}>
                        <canvas
                            ref={canvasRef}
                            style={{
                                display: 'block',
                                touchAction: 'none', // Prevent browser gestures
                                cursor: 'crosshair',
                                maxWidth: '100%',
                                height: 'auto'
                            }}
                            onMouseDown={beginDraw}
                            onMouseMove={draw}
                            onMouseUp={endDraw}
                            onMouseLeave={endDraw}
                            onTouchStart={beginDraw}
                            onTouchMove={draw}
                            onTouchEnd={endDraw}
                        />
                        {loading && (
                            <div style={{
                                position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: 'rgba(255,255,255,0.8)'
                            }}>
                                <div className="loading-spinner"></div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer - Only for Cancel on Desktop */}
                <div className="desktop-only" style={{
                    padding: '0.75rem 1.5rem',
                    borderTop: '1px solid var(--clr-border)',
                    background: '#fff',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '0.75rem'
                }}>
                    <button onClick={onClose} className="btn" style={{ fontWeight: 600, color: 'var(--clr-text-secondary)', fontSize: '0.85rem' }}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
