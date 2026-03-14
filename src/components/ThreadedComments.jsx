import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRFI } from '../context/RFIContext';
import UserAvatar from './UserAvatar';
import ImageMarkupModal from './ImageMarkupModal';
import { Send, Loader2, Paperclip, Brush, X } from 'lucide-react';

export default function ThreadedComments({ rfiId, onCommentAdded, scrollTrigger }) {
    const { user } = useAuth();
    const { fetchComments, addComment, updateComment } = useRFI();
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editingValue, setEditingValue] = useState('');
    const [composerOpen, setComposerOpen] = useState(false);
    const [composerImages, setComposerImages] = useState([]);
    const [composerCaption, setComposerCaption] = useState('');
    const [composerPreviewUrls, setComposerPreviewUrls] = useState([]);
    const [activeComposerIndex, setActiveComposerIndex] = useState(0);
    const [markupIndex, setMarkupIndex] = useState(null);
    const prevCommentsLength = useRef(0);
    const messagesEndRef = useRef(null);
    const attachInputRef = useRef(null);

    useEffect(() => {
        if (composerImages.length === 0) {
            setComposerPreviewUrls([]);
            return;
        }

        const nextUrls = composerImages.map((file) => URL.createObjectURL(file));
        setComposerPreviewUrls(nextUrls);

        return () => nextUrls.forEach((url) => URL.revokeObjectURL(url));
    }, [composerImages]);

    useEffect(() => {
        loadComments();
        // Set up polling (5s)
        const interval = setInterval(loadComments, 5000);
        return () => clearInterval(interval);
    }, [rfiId]);

    useEffect(() => {
        // SCROLL ON TRIGGER (Button Click)
        if (scrollTrigger && messagesEndRef.current) {
            // Multiple attempts to ensure scroll reaches true bottom after layout settles
            const delays = [50, 200, 500];
            const timers = delays.map(ms =>
                setTimeout(() => scrollToBottom(), ms)
            );
            return () => timers.forEach(t => clearTimeout(t));
        }
    }, [scrollTrigger, loading]); // Fire on trigger OR when loading finishes if we had a trigger

    useEffect(() => {
        // Silent updates for background polling
        prevCommentsLength.current = comments.length;
    }, [comments]);

    const loadComments = async () => {
        const data = await fetchComments(rfiId);
        setComments(data);
        setLoading(false);
    };

    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const trimmed = newComment.trim();
        if (!trimmed || submitting) return;

        setSubmitting(true);
        try {
            await addComment(rfiId, trimmed);
            setNewComment('');
            await loadComments();
            scrollToBottom(); // Manually scroll when the user themselves sends a message
            if (onCommentAdded) onCommentAdded();
        } catch (error) {
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    const startEdit = (comment) => {
        setEditingCommentId(comment.id);
        setEditingValue(comment.content);
    };

    const cancelEdit = () => {
        setEditingCommentId(null);
        setEditingValue('');
    };

    const handleEditSubmit = async (commentId) => {
        const trimmed = editingValue.trim();
        if (!trimmed || submitting) return;

        setSubmitting(true);
        try {
            await updateComment(commentId, trimmed);
            await loadComments();
            cancelEdit();
        } catch (error) {
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    const openFilePicker = () => {
        attachInputRef.current?.click();
    };

    const handleSelectAttachments = (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        setComposerImages(files);
        setActiveComposerIndex(0);
        setComposerCaption(newComment.trim());
        if (newComment.trim()) {
            setNewComment('');
        }
        setComposerOpen(true);

        e.target.value = '';
    };

    const closeComposer = () => {
        setComposerOpen(false);
        setComposerImages([]);
        setComposerCaption('');
        setActiveComposerIndex(0);
        setMarkupIndex(null);
    };

    const replaceComposerImage = (index, file) => {
        setComposerImages((prev) => prev.map((img, i) => (i === index ? file : img)));
    };

    const handleComposerSend = async () => {
        const trimmed = composerCaption.trim();
        if (composerImages.length === 0 || submitting) return;

        setSubmitting(true);
        try {
            await addComment(rfiId, trimmed, { attachments: composerImages });
            closeComposer();
            await loadComments();
            scrollToBottom();
            if (onCommentAdded) onCommentAdded();
        } catch (error) {
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    const parseCommentContent = (rawContent = '') => {
        const images = [];
        const text = rawContent.replace(/\[img\](.*?)\[\/img\]/gi, (_, url) => {
            if (url) images.push(url.trim());
            return '';
        }).trim();
        return { text, images };
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                <Loader2 className="spinner" size={24} color="var(--clr-brand)" />
            </div>
        );
    }

    return (
        <div className="threaded-comments">
            <div className="comments-list">
                {comments.length === 0 ? (
                    <div className="empty-comments">
                        <p>No comments yet. Start the discussion!</p>
                    </div>
                ) : (
                    comments.map(c => {
                        const isMe = c.userId === user.id;
                        const parsed = parseCommentContent(c.content);
                        return (
                            <div key={c.id} className={`comment-bubble-wrapper ${isMe ? 'is-me' : ''}`}>
                                {!isMe && <UserAvatar name={c.userName} size={32} />}
                                <div className={`comment-bubble ${isMe ? 'is-me' : ''}`}>
                                    <div className="comment-header">
                                        <span className="comment-name">{c.userName}</span>
                                        {c.userRole && <span className="comment-role">({c.userRole})</span>}
                                        <span className="comment-time">
                                            {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    {editingCommentId === c.id ? (
                                        <div style={{ display: 'grid', gap: '0.45rem' }}>
                                            <input
                                                type="text"
                                                value={editingValue}
                                                onChange={(e) => setEditingValue(e.target.value)}
                                                className="comment-input"
                                                disabled={submitting}
                                            />
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-ghost"
                                                    onClick={cancelEdit}
                                                    disabled={submitting}
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-action"
                                                    onClick={() => handleEditSubmit(c.id)}
                                                    disabled={submitting || !editingValue.trim()}
                                                >
                                                    Resend
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            {parsed.text ? <div className="comment-content">{parsed.text}</div> : null}
                                            {parsed.images.length > 0 && (
                                                <div className="chat-image-grid">
                                                    {parsed.images.map((imgUrl, idx) => (
                                                        <a key={`${c.id}_img_${idx}`} href={imgUrl} target="_blank" rel="noopener noreferrer" className="chat-image-thumb">
                                                            <img src={imgUrl} alt={`Comment attachment ${idx + 1}`} />
                                                        </a>
                                                    ))}
                                                </div>
                                            )}
                                            {isMe && (
                                                <div style={{ marginTop: '0.35rem', display: 'flex', justifyContent: 'flex-end' }}>
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-ghost"
                                                        onClick={() => startEdit(c)}
                                                        style={{ padding: '0.2rem 0.45rem', fontSize: '0.72rem' }}
                                                    >
                                                        Edit
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="comment-form">
                <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Type a message..."
                    className="comment-input"
                    disabled={submitting}
                />
                <input
                    ref={attachInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    style={{ display: 'none' }}
                    onChange={handleSelectAttachments}
                />
                <button
                    type="button"
                    className="btn btn-ghost comment-attach-btn"
                    onClick={openFilePicker}
                    disabled={submitting}
                    title="Attach image"
                >
                    <Paperclip size={16} />
                </button>
                <button
                    type="submit"
                    className="btn btn-action comment-submit-btn"
                    disabled={!newComment.trim() || submitting}
                    style={{ padding: '0.5rem', borderRadius: 'var(--radius-full)' }}
                >
                    {submitting ? <Loader2 className="spinner" size={18} /> : <Send size={18} />}
                </button>
            </form>

            {composerOpen && composerImages.length > 0 && (
                <div className="modal-overlay" onClick={closeComposer} style={{ zIndex: 1150 }}>
                    <div className="chat-attachment-composer" onClick={(e) => e.stopPropagation()}>
                        <div className="chat-attachment-header">
                            <h3>Send attachment</h3>
                            <button className="btn-close" onClick={closeComposer} disabled={submitting}>
                                <X size={18} color="var(--clr-text-secondary)" />
                            </button>
                        </div>

                        <div className="chat-attachment-preview-wrap">
                            <img
                                src={composerPreviewUrls[activeComposerIndex]}
                                alt={`Attachment preview ${activeComposerIndex + 1}`}
                                className="chat-attachment-preview"
                            />
                            <button
                                type="button"
                                className="btn btn-sm btn-ghost chat-attachment-markup"
                                onClick={() => setMarkupIndex(activeComposerIndex)}
                                disabled={submitting}
                            >
                                <Brush size={14} /> Markup
                            </button>
                        </div>

                        {composerImages.length > 1 && (
                            <div className="chat-attachment-thumbs">
                                {composerPreviewUrls.map((previewUrl, index) => (
                                    <button
                                        key={`${previewUrl}_${index}`}
                                        type="button"
                                        className={`chat-attachment-thumb ${index === activeComposerIndex ? 'active' : ''}`}
                                        onClick={() => setActiveComposerIndex(index)}
                                        disabled={submitting}
                                    >
                                        <img src={previewUrl} alt={`Attachment ${index + 1}`} />
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="chat-attachment-footer">
                            <textarea
                                value={composerCaption}
                                onChange={(e) => setComposerCaption(e.target.value)}
                                placeholder="Add a caption (optional)"
                                className="chat-attachment-caption"
                                rows={2}
                                disabled={submitting}
                            />
                            <button
                                type="button"
                                className="btn btn-action chat-attachment-send"
                                onClick={handleComposerSend}
                                disabled={composerImages.length === 0 || submitting}
                            >
                                {submitting ? <Loader2 className="spinner" size={18} /> : <Send size={16} />}
                                <span>Send</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {markupIndex !== null && composerImages[markupIndex] && (
                <ImageMarkupModal
                    image={composerImages[markupIndex]}
                    onClose={() => setMarkupIndex(null)}
                    onSave={(annotatedFile) => {
                        replaceComposerImage(markupIndex, annotatedFile);
                        setMarkupIndex(null);
                    }}
                />
            )}
        </div>
    );
}
