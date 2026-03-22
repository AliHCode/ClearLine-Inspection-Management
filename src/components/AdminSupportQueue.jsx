import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';
import { 
    RefreshCw, LifeBuoy, ChevronDown, Paperclip, Send, ArrowRight 
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function AdminSupportQueue() {
    const [supportTickets, setSupportTickets] = useState([]);
    const [supportLoading, setSupportLoading] = useState(false);
    const [supportFilter, setSupportFilter] = useState('all');
    const [expandedSupportTicket, setExpandedSupportTicket] = useState(null);
    const [replyText, setReplyText] = useState({});

    const fetchSupportTickets = useCallback(async () => {
        setSupportLoading(true);
        try {
            const { data, error } = await supabase
                .from('support_tickets')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            setSupportTickets(data || []);
        } catch (err) {
            console.error('Error fetching support tickets:', err);
            toast.error('Failed to load support tickets');
        } finally {
            setSupportLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSupportTickets();
    }, [fetchSupportTickets]);

    async function handleReply(ticketId) {
        const reply = replyText[ticketId];
        if (!reply?.trim()) return;
        try {
            const { error } = await supabase
                .from('support_tickets')
                .update({ admin_reply: reply.trim(), status: 'resolved' })
                .eq('id', ticketId);
            if (error) throw error;
            
            toast.success('Reply sent & ticket resolved');
            setReplyText(prev => ({ ...prev, [ticketId]: '' }));
            fetchSupportTickets();
        } catch (error) {
            toast.error('Error: ' + error.message);
        }
    }

    async function handleStatusChange(ticketId, newStatus) {
        try {
            const { error } = await supabase
                .from('support_tickets')
                .update({ status: newStatus })
                .eq('id', ticketId);
            if (error) throw error;
            
            toast.success('Status updated to ' + newStatus);
            fetchSupportTickets();
        } catch (error) {
            toast.error('Error: ' + error.message);
        }
    }

    const filtered = supportFilter === 'all' ? supportTickets : supportTickets.filter(t => t.status === supportFilter);
    const STATUS_CFG = { 
        open: { color: '#3b82f6', bg: '#eff6ff' }, 
        in_progress: { color: '#d97706', bg: '#fffbeb' }, 
        resolved: { color: '#059669', bg: '#ecfdf5' }, 
        closed: { color: '#64748b', bg: '#f1f5f9' } 
    };

    return (
        <div className="admin-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Support Queue</h2>
                <button 
                    className="btn btn-ghost btn-sm" 
                    onClick={fetchSupportTickets} 
                    disabled={supportLoading}
                >
                    <RefreshCw size={16} className={supportLoading ? 'spinner' : ''} />
                </button>
            </div>

            {/* Filter Row */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                {['all', 'open', 'in_progress', 'resolved', 'closed'].map(f => (
                    <button
                        key={f}
                        onClick={() => setSupportFilter(f)}
                        style={{
                            padding: '0.4rem 0.85rem',
                            borderRadius: '8px',
                            border: supportFilter === f ? '2px solid #0f172a' : '1px solid #e2e8f0',
                            background: supportFilter === f ? '#0f172a' : '#fff',
                            color: supportFilter === f ? '#fff' : '#64748b',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            textTransform: 'capitalize',
                        }}
                    >
                        {f === 'all' ? 'All' : f === 'in_progress' ? 'In Progress' : f}
                        {f !== 'all' && (
                            <span style={{ marginLeft: '4px', opacity: 0.7 }}>
                                ({supportTickets.filter(t => t.status === f).length})
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {supportLoading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                    <RefreshCw size={24} className="spinner" style={{ margin: '0 auto 0.5rem' }} />
                    <p style={{ fontSize: '0.85rem' }}>Loading tickets...</p>
                </div>
            ) : (() => {
                if (filtered.length === 0) return (
                    <div style={{ textAlign: 'center', padding: '3rem' }}>
                        <LifeBuoy size={40} style={{ color: '#cbd5e1', margin: '0 auto 1rem' }} />
                        <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem' }}>No tickets found</h4>
                        <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>There are no support tickets matching this filter.</p>
                    </div>
                );

                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        {filtered.map(ticket => {
                            const sCfg = STATUS_CFG[ticket.status] || STATUS_CFG.open;
                            const isExp = expandedSupportTicket === ticket.id;
                            const createdAt = new Date(ticket.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

                            return (
                                <div key={ticket.id} style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden', background: '#fff' }}>
                                    {/* Row */}
                                    <div
                                        onClick={() => setExpandedSupportTicket(isExp ? null : ticket.id)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '0.6rem',
                                            padding: '0.75rem 1rem', cursor: 'pointer',
                                            background: isExp ? '#f8fafc' : '#fff',
                                        }}
                                    >
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', background: sCfg.bg, color: sCfg.color, fontSize: '0.6rem', fontWeight: 700, padding: '0.2rem 0.45rem', borderRadius: '5px', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap', flexShrink: 0 }}>
                                            {ticket.status === 'open' ? '●' : ticket.status === 'in_progress' ? '◐' : ticket.status === 'resolved' ? '✓' : '—'} {ticket.status.replace('_', ' ')}
                                        </span>
                                        <span style={{ flex: 1, fontSize: '0.85rem', fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {ticket.subject}
                                        </span>
                                        <span style={{ fontSize: '0.7rem', color: '#94a3b8', whiteSpace: 'nowrap', flexShrink: 0 }}>
                                            {ticket.user_name}
                                        </span>
                                        <span style={{ fontSize: '0.7rem', color: '#cbd5e1', whiteSpace: 'nowrap', flexShrink: 0 }}>
                                            {createdAt}
                                        </span>
                                        <ChevronDown size={14} style={{ color: '#94a3b8', transform: isExp ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', flexShrink: 0 }} />
                                    </div>

                                    {/* Expanded */}
                                    {isExp && (
                                        <div style={{ padding: '1rem', borderTop: '1px solid #e2e8f0', background: '#fafbfc' }}>
                                            {/* Meta */}
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                                <span style={{ background: '#f1f5f9', borderRadius: '6px', padding: '0.3rem 0.6rem', fontSize: '0.7rem', fontWeight: 600, color: '#475569' }}>👤 {ticket.user_name}</span>
                                                <span style={{ background: '#f1f5f9', borderRadius: '6px', padding: '0.3rem 0.6rem', fontSize: '0.7rem', fontWeight: 600, color: '#475569', textTransform: 'capitalize' }}>🏷️ {ticket.user_role}</span>
                                                <span style={{ background: '#f1f5f9', borderRadius: '6px', padding: '0.3rem 0.6rem', fontSize: '0.7rem', fontWeight: 600, color: '#475569' }}>🏢 {ticket.project_name || 'N/A'}</span>
                                                {ticket.user_email && <span style={{ background: '#f1f5f9', borderRadius: '6px', padding: '0.3rem 0.6rem', fontSize: '0.7rem', fontWeight: 600, color: '#475569' }}>✉️ {ticket.user_email}</span>}
                                            </div>

                                            {/* Message */}
                                            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.85rem', fontSize: '0.85rem', color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-wrap', marginBottom: (ticket.attachment_url || ticket.admin_reply) ? '0.75rem' : '1.25rem' }}>
                                                {ticket.message}
                                            </div>

                                            {/* Attachment Link */}
                                            {ticket.attachment_url && (
                                                <a
                                                    href={ticket.attachment_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{
                                                        display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                                                        background: '#f1f5f9', border: '1px solid #e2e8f0',
                                                        borderRadius: '6px', padding: '0.4rem 0.75rem',
                                                        fontSize: '0.75rem', fontWeight: 600, color: '#334155',
                                                        textDecoration: 'none', marginBottom: ticket.admin_reply ? '0.75rem' : '1.25rem',
                                                    }}
                                                >
                                                    <Paperclip size={14} color="#64748b" /> View Attachment
                                                </a>
                                            )}

                                            {/* Existing Admin Reply */}
                                            {ticket.admin_reply && (
                                                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '0.85rem', marginBottom: '0.75rem' }}>
                                                    <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <ArrowRight size={11} /> Your Reply
                                                    </div>
                                                    <div style={{ fontSize: '0.85rem', color: '#1e40af', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                                                        {ticket.admin_reply}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Actions Row */}
                                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                                                {/* Reply Input */}
                                                <div style={{ flex: 1, minWidth: '200px' }}>
                                                    <textarea
                                                        placeholder="Type your reply..."
                                                        value={replyText[ticket.id] || ''}
                                                        onChange={e => setReplyText(prev => ({ ...prev, [ticket.id]: e.target.value }))}
                                                        rows={2}
                                                        style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.8rem', fontFamily: 'inherit', resize: 'none', boxSizing: 'border-box' }}
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => handleReply(ticket.id)}
                                                    disabled={!replyText[ticket.id]?.trim()}
                                                    style={{
                                                        padding: '0.6rem 1rem', borderRadius: '8px', border: 'none',
                                                        background: '#0f172a', color: '#fff', fontWeight: 700,
                                                        fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'inherit',
                                                        display: 'flex', alignItems: 'center', gap: '4px',
                                                        opacity: replyText[ticket.id]?.trim() ? 1 : 0.5,
                                                        whiteSpace: 'nowrap',
                                                    }}
                                                >
                                                    <Send size={13} /> Reply & Resolve
                                                </button>
                                                <select
                                                    value={ticket.status}
                                                    onChange={e => handleStatusChange(ticket.id, e.target.value)}
                                                    style={{
                                                        padding: '0.6rem 0.75rem', borderRadius: '8px',
                                                        border: '1px solid #e2e8f0', fontSize: '0.75rem',
                                                        fontWeight: 600, fontFamily: 'inherit',
                                                        color: '#475569', cursor: 'pointer', background: '#fff',
                                                    }}
                                                >
                                                    <option value="open">Open</option>
                                                    <option value="in_progress">In Progress</option>
                                                    <option value="resolved">Resolved</option>
                                                    <option value="closed">Closed</option>
                                                </select>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                );
            })()}
        </div>
    );
}
