import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import { USER_ROLES } from '../utils/constants';
import Header from '../components/Header';
import UserAvatar from '../components/UserAvatar';
import {
    Users, Shield, UserX, UserCheck, RefreshCw,
    FolderPlus, Trash2, Plus, GripVertical,
    Building, Columns3, UserPlus, X, AlertCircle
} from 'lucide-react';

const FIELD_TYPES = [
    { value: 'text', label: 'Text' },
    { value: 'number', label: 'Number' },
    { value: 'select', label: 'Dropdown' },
    { value: 'date', label: 'Date' },
    { value: 'textarea', label: 'Long Text' },
];

export default function AdminDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const {
        projects, activeProject, fetchProjects, createProject, deleteProject, changeActiveProject,
        projectFields, addProjectField, updateProjectField, deleteProjectField,
        assignUserToProject, removeUserFromProject, fetchProjectMembers,
    } = useProject();

    const [activeTab, setActiveTab] = useState('projects');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionMessage, setActionMessage] = useState('');
    const [pendingApprove, setPendingApprove] = useState({});
    const [rejectedCollapsed, setRejectedCollapsed] = useState(false);

    // Memberships & team management
    const [allMemberships, setAllMemberships] = useState([]);
    const [teamProjectId, setTeamProjectId] = useState('');
    const [assignProject, setAssignProject] = useState({});
    const [addMemberUserId, setAddMemberUserId] = useState('');
    const [addMemberRole, setAddMemberRole] = useState('contractor');

    // Project creation form
    const [showNewProject, setShowNewProject] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectDesc, setNewProjectDesc] = useState('');

    // Field creation form
    const [showNewField, setShowNewField] = useState(false);
    const [newField, setNewField] = useState({ field_name: '', field_key: '', field_type: 'text', is_required: false, options: '' });

    // ─── Fetch all users ───
    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .not('is_archived', 'eq', true)
                .order('name');
            if (error) throw error;
            setUsers(data || []);
        } catch (err) {
            console.error('Error fetching users:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch all project memberships across all projects
    const fetchAllMemberships = useCallback(async () => {
        const { data, error } = await supabase
            .from('project_members')
            .select('user_id, project_id, role');
        if (!error) setAllMemberships(data || []);
    }, []);

    useEffect(() => { fetchUsers(); fetchAllMemberships(); }, [fetchUsers, fetchAllMemberships]);

    function showMsg(msg) {
        setActionMessage(msg);
        setTimeout(() => setActionMessage(''), 3000);
    }

    // ─── User actions ───
    async function toggleUserActive(userId, currentStatus) {
        const { error } = await supabase.from('profiles').update({ is_active: !currentStatus }).eq('id', userId);
        if (!error) { showMsg(!currentStatus ? 'User reactivated' : 'User deactivated'); fetchUsers(); }
        else showMsg('Error updating user');
    }

    async function changeUserRole(userId, newRole) {
        const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
        if (!error) { showMsg(`Role updated to ${newRole}`); fetchUsers(); }
        else showMsg('Error updating role');
    }

    // Approve pending or re-approve rejected: sets role ONLY (no project yet)
    async function approveUser(userId, userName) {
        const pa = pendingApprove[userId] || {};
        const role = pa.role;
        if (!role) { showMsg('Select a role first'); return; }
        const { data, error } = await supabase.from('profiles').update({ role }).eq('id', userId).select();
        if (error) { showMsg('Error: ' + error.message); return; }
        if (!data || data.length === 0) { showMsg('Error: Update blocked — check RLS policies on profiles table'); return; }
        showMsg(`${userName} approved as ${role}`);
        setPendingApprove(prev => { const n = { ...prev }; delete n[userId]; return n; });
        await fetchUsers();
    }

    // Decline a pending user — moves them to Rejected section
    async function declineUser(userId) {
        const { error } = await supabase.from('profiles').update({ role: 'rejected' }).eq('id', userId);
        if (!error) { showMsg('Request declined'); fetchUsers(); }
        else showMsg('Error: ' + error.message);
    }

    // Archive = soft-delete: hides card from dashboard, user record stays in DB
    async function archiveUser(userId, userName) {
        const { error } = await supabase.from('profiles').update({ is_archived: true }).eq('id', userId);
        if (!error) { showMsg(`${userName} removed`); fetchUsers(); }
        else showMsg('Error: ' + error.message);
    }

    // Assign unassigned user to a project
    async function assignUnassignedUser(userId, userName) {
        const projectId = assignProject[userId];
        if (!projectId) { showMsg('Select a project first'); return; }
        const u = users.find(x => x.id === userId);
        const role = u?.role || 'contractor';
        const result = await assignUserToProject(projectId, userId, role);
        if (result?.success) {
            showMsg(`${userName} assigned to project`);
            setAssignProject(prev => { const n = { ...prev }; delete n[userId]; return n; });
            fetchAllMemberships();
        } else {
            showMsg('Error: ' + (result?.error || 'Assignment failed'));
        }
    }

    // Add a member to the currently viewed project team
    async function handleAddTeamMember() {
        if (!addMemberUserId || !effectiveTeamProjectId) return;
        const result = await assignUserToProject(effectiveTeamProjectId, addMemberUserId, addMemberRole);
        if (result?.success) {
            showMsg('Member added to project');
            setAddMemberUserId('');
            fetchAllMemberships();
            fetchUsers();
        } else {
            showMsg('Error: ' + (result?.error || 'Failed'));
        }
    }

    // Remove a member from the currently viewed project team
    async function handleRemoveTeamMember(userId) {
        if (!effectiveTeamProjectId || !window.confirm('Remove this member from the project?')) return;
        const result = await removeUserFromProject(effectiveTeamProjectId, userId);
        if (result?.success) {
            showMsg('Member removed from project');
            fetchAllMemberships();
        }
    }

    // ─── Project actions ───
    async function handleCreateProject(e) {
        e.preventDefault();
        if (!newProjectName.trim()) return;
        const result = await createProject(newProjectName.trim(), newProjectDesc.trim());
        if (result?.success) {
            showMsg('Project created');
            setNewProjectName('');
            setNewProjectDesc('');
            setShowNewProject(false);
            fetchProjects();
        } else {
            showMsg('Error: ' + (result?.error || 'Failed to create project'));
        }
    }

    async function handleDeleteProject(projectId) {
        if (projectId === '00000000-0000-0000-0000-000000000000') {
            showMsg('Cannot delete the default project');
            return;
        }
        if (!window.confirm('Delete this project and all its RFI fields? This cannot be undone.')) return;
        const result = await deleteProject(projectId);
        if (result?.success) { showMsg('Project deleted'); fetchProjects(); }
        else showMsg('Error: ' + (result?.error || 'Delete failed'));
    }

    // ─── Field actions ───
    async function handleAddField(e) {
        e.preventDefault();
        if (!newField.field_name.trim() || !activeProject) return;
        const key = newField.field_key.trim() || newField.field_name.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
        const opts = newField.field_type === 'select' && newField.options
            ? newField.options.split(',').map(o => o.trim()).filter(Boolean)
            : [];

        const maxOrder = projectFields.reduce((m, f) => Math.max(m, f.sort_order || 0), 0);
        const result = await addProjectField(activeProject.id, {
            field_name: newField.field_name.trim(),
            field_key: key,
            field_type: newField.field_type,
            is_required: newField.is_required,
            sort_order: maxOrder + 1,
            options: opts,
        });
        if (result?.success) {
            showMsg('Field added');
            setNewField({ field_name: '', field_key: '', field_type: 'text', is_required: false, options: '' });
            setShowNewField(false);
        } else {
            showMsg('Error: ' + (result?.error || 'Failed'));
        }
    }

    async function handleDeleteField(fieldId) {
        if (!window.confirm('Delete this RFI field?')) return;
        const result = await deleteProjectField(fieldId);
        if (result?.success) showMsg('Field removed');
        else showMsg('Error: ' + (result?.error || 'Failed'));
    }

    async function handleToggleRequired(field) {
        await updateProjectField(field.id, { is_required: !field.is_required });
    }

    // ─── Computed ───
    const pendingUsers = users.filter(u => u.role === 'pending');
    const rejectedUsers = users.filter(u => u.role === 'rejected');
    const activeUsers = users.filter(u => !['pending', 'rejected'].includes(u.role));

    // Users who have a role but aren't in ANY project
    const assignedUserIds = new Set(allMemberships.map(m => m.user_id));
    const unassignedUsers = activeUsers.filter(u => !assignedUserIds.has(u.id));

    // Project Teams computed
    const effectiveTeamProjectId = teamProjectId || activeProject?.id || '';
    const teamMemberships = allMemberships.filter(m => m.project_id === effectiveTeamProjectId);
    const teamUsers = teamMemberships.map(m => {
        const u = users.find(x => x.id === m.user_id);
        return u ? { ...u, memberRole: m.role } : null;
    }).filter(Boolean);
    // Users eligible to add to this project (active, not already in this project)
    const teamMemberIds = new Set(teamMemberships.map(m => m.user_id));
    const addableUsers = activeUsers.filter(u => !teamMemberIds.has(u.id) && u.id !== user.id);

    const stats = {
        pending: pendingUsers.length,
        unassigned: unassignedUsers.length,
    };

    return (
        <div className="page-wrapper">
            <Header />
            <main className="admin-page">
                <div className="sheet-header">
                    <div>
                        <h1><Shield size={24} /> Admin Command Center</h1>
                        <p className="subtitle" style={{ marginTop: '0.25rem' }}>Manage projects, RFI fields, users &amp; assignments</p>
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={() => { fetchUsers(); fetchProjects(); }} disabled={loading}>
                        <RefreshCw size={16} className={loading ? 'spinner' : ''} /> Refresh
                    </button>
                    {/* Quick stats bar */}
                    {activeTab === 'users' && (
                        <div className="users-stat-pills" style={{ marginLeft: 'auto', marginRight: '0.5rem' }}>
                            {stats.pending > 0 && <span className="ustat-pill ustat-warning">⏳ {stats.pending} Pending</span>}
                            {stats.unassigned > 0 && <span className="ustat-pill ustat-info">🔔 {stats.unassigned} Unassigned</span>}
                        </div>
                    )}
                </div>

                {/* Tabs */}
                <div className="admin-tabs">
                    <button className={`admin-tab-btn ${activeTab === 'projects' ? 'active' : ''}`} onClick={() => setActiveTab('projects')}>
                        <Building size={16} /> Projects
                    </button>
                    <button className={`admin-tab-btn ${activeTab === 'fields' ? 'active' : ''}`} onClick={() => setActiveTab('fields')}>
                        <Columns3 size={16} /> RFI Table Fields
                    </button>
                    <button className={`admin-tab-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
                        <Users size={16} /> Users &amp; Assignments
                        {stats.pending > 0 && <span className="admin-tab-badge">{stats.pending}</span>}
                    </button>
                </div>

                {actionMessage && (
                    <div className={`submit-message ${actionMessage.startsWith('Error') ? 'warning' : 'success'}`}>
                        {actionMessage}
                    </div>
                )}

                {/* ═══════════ TAB: PROJECTS ═══════════ */}
                {activeTab === 'projects' && (
                    <div className="admin-section">
                        <div className="admin-section-header">
                            <h2><Building size={20} /> Projects</h2>
                            <button className="btn btn-sm" style={{ background: 'var(--clr-brand-secondary)', color: '#fff', border: 'none' }}
                                onClick={() => setShowNewProject(!showNewProject)}>
                                <FolderPlus size={16} /> New Project
                            </button>
                        </div>

                        {showNewProject && (
                            <form className="admin-inline-form" onSubmit={handleCreateProject}>
                                <input type="text" placeholder="Project name *" value={newProjectName}
                                    onChange={e => setNewProjectName(e.target.value)} required />
                                <input type="text" placeholder="Description (optional)" value={newProjectDesc}
                                    onChange={e => setNewProjectDesc(e.target.value)} />
                                <button type="submit" className="btn btn-sm" style={{ background: 'var(--clr-brand-secondary)', color: '#fff', border: 'none' }}>
                                    Create
                                </button>
                                <button type="button" className="btn btn-sm btn-ghost" onClick={() => setShowNewProject(false)}>Cancel</button>
                            </form>
                        )}

                        <div className="admin-project-grid">
                            {projects.map(p => (
                                <div key={p.id} className={`admin-project-card ${activeProject?.id === p.id ? 'active' : ''}`}
                                    onClick={() => changeActiveProject(p.id)}>
                                    <div className="admin-project-card-header">
                                        <div>
                                            <h3>{p.name}</h3>
                                            {p.description && <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>{p.description}</p>}
                                        </div>
                                        {p.id !== '00000000-0000-0000-0000-000000000000' && (
                                            <button className="btn btn-sm btn-ghost" style={{ color: 'var(--clr-danger)' }}
                                                onClick={e => { e.stopPropagation(); handleDeleteProject(p.id); }}
                                                title="Delete project">
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                    {activeProject?.id === p.id && (
                                        <span className="admin-project-active-badge">Active</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ═══════════ TAB: RFI FIELDS ═══════════ */}
                {activeTab === 'fields' && (
                    <div className="admin-section">
                        <div className="admin-section-header">
                            <h2><Columns3 size={20} /> RFI Table Columns — {activeProject?.name || 'Select a project'}</h2>
                            <button className="btn btn-sm" style={{ background: 'var(--clr-brand-secondary)', color: '#fff', border: 'none' }}
                                onClick={() => setShowNewField(!showNewField)}>
                                <Plus size={16} /> Add Column
                            </button>
                        </div>

                        <p className="text-muted" style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
                            Define the columns that appear in the RFI table for <strong>{activeProject?.name}</strong>. 
                            The built-in columns (Sr#, Status, Attachments, Actions) are always shown. These custom fields control what data contractors fill in.
                        </p>

                        {showNewField && (
                            <form className="admin-inline-form" onSubmit={handleAddField}>
                                <input type="text" placeholder="Column name *" value={newField.field_name}
                                    onChange={e => setNewField(prev => ({ ...prev, field_name: e.target.value }))} required />
                                <input type="text" placeholder="Key (auto-generated)" value={newField.field_key}
                                    onChange={e => setNewField(prev => ({ ...prev, field_key: e.target.value }))} />
                                <select value={newField.field_type}
                                    onChange={e => setNewField(prev => ({ ...prev, field_type: e.target.value }))}>
                                    {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                                {newField.field_type === 'select' && (
                                    <input type="text" placeholder="Options (comma separated)" value={newField.options}
                                        onChange={e => setNewField(prev => ({ ...prev, options: e.target.value }))} />
                                )}
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                                    <input type="checkbox" checked={newField.is_required}
                                        onChange={e => setNewField(prev => ({ ...prev, is_required: e.target.checked }))} />
                                    Required
                                </label>
                                <button type="submit" className="btn btn-sm" style={{ background: 'var(--clr-brand-secondary)', color: '#fff', border: 'none' }}>Add</button>
                                <button type="button" className="btn btn-sm btn-ghost" onClick={() => setShowNewField(false)}>Cancel</button>
                            </form>
                        )}

                        <div className="rfi-table-wrapper">
                            <table className="rfi-table editable">
                                <thead>
                                    <tr>
                                        <th style={{ width: '40px' }}>#</th>
                                        <th>Column Name</th>
                                        <th>Key</th>
                                        <th>Type</th>
                                        <th>Options</th>
                                        <th style={{ width: '80px' }}>Required</th>
                                        <th style={{ width: '80px', textAlign: 'center' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {projectFields.length === 0 ? (
                                        <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>No custom fields yet. Click "Add Column" to create RFI table headings.</td></tr>
                                    ) : (
                                        projectFields.map((f, i) => (
                                            <tr key={f.id}>
                                                <td>{i + 1}</td>
                                                <td style={{ fontWeight: 600 }}>{f.field_name}</td>
                                                <td><code style={{ fontSize: '0.8rem', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{f.field_key}</code></td>
                                                <td>{FIELD_TYPES.find(t => t.value === f.field_type)?.label || f.field_type}</td>
                                                <td>
                                                    {f.field_type === 'select' && Array.isArray(f.options) ? (
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                                                            {f.options.map((o, idx) => (
                                                                <span key={idx} style={{ background: '#e2e8f0', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem' }}>{o}</span>
                                                            ))}
                                                        </div>
                                                    ) : '—'}
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <input type="checkbox" checked={f.is_required} onChange={() => handleToggleRequired(f)} />
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <button className="btn btn-sm btn-ghost" style={{ color: 'var(--clr-danger)' }}
                                                        onClick={() => handleDeleteField(f.id)} title="Delete field">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ═══════════ TAB: USERS & ASSIGNMENTS ═══════════ */}
                {activeTab === 'users' && (
                    <div className="admin-section">

                        {/* ── PENDING APPROVALS ── */}
                        {pendingUsers.length > 0 && (
                            <div className="ua-block">
                                <div className="ua-block-header">
                                    <div className="ua-block-label">
                                        <span className="ua-count">{pendingUsers.length}</span>
                                        Pending Approval{pendingUsers.length !== 1 ? 's' : ''}
                                    </div>
                                </div>
                                <p className="ua-hint">Approve new sign-ups by assigning a role. They'll move to Unassigned for project placement.</p>
                                <div className="ua-list">
                                    {pendingUsers.map(pu => {
                                        const pa = pendingApprove[pu.id] || {};
                                        return (
                                            <div key={pu.id} className="ua-row">
                                                <div className="ua-row-user">
                                                    <UserAvatar name={pu.name} size={36} />
                                                    <div>
                                                        <div className="ua-row-name">{pu.name}</div>
                                                        <div className="ua-row-meta">{pu.company || 'No company'}</div>
                                                    </div>
                                                </div>
                                                <div className="ua-row-actions">
                                                    <select className="ua-select"
                                                        value={pa.role || ''}
                                                        onChange={e => setPendingApprove(prev => ({ ...prev, [pu.id]: { ...pa, role: e.target.value } }))}>
                                                        <option value="" disabled>Role…</option>
                                                        <option value="contractor">Contractor</option>
                                                        <option value="consultant">Consultant</option>
                                                        <option value="admin">Admin</option>
                                                    </select>
                                                    <button className="ua-btn ua-btn-primary" onClick={() => approveUser(pu.id, pu.name)}>
                                                        <UserCheck size={14} /> Approve
                                                    </button>
                                                    <button className="ua-btn ua-btn-danger-ghost" onClick={() => declineUser(pu.id, pu.name)}>
                                                        <UserX size={14} /> Decline
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* ── REJECTED ── */}
                        {rejectedUsers.length > 0 && (
                            <div className="ua-block ua-block-muted">
                                <button className="ua-block-header ua-collapse-btn" onClick={() => setRejectedCollapsed(c => !c)}>
                                    <div className="ua-block-label">
                                        <span className="ua-count ua-count-muted">{rejectedUsers.length}</span>
                                        Rejected
                                    </div>
                                    <span className="ua-chevron">{rejectedCollapsed ? '›' : '‹'}</span>
                                </button>
                                {!rejectedCollapsed && (
                                    <div className="ua-list">
                                        {rejectedUsers.map(ru => {
                                            const pa = pendingApprove[ru.id] || {};
                                            return (
                                                <div key={ru.id} className="ua-row">
                                                    <div className="ua-row-user">
                                                        <UserAvatar name={ru.name} size={36} />
                                                        <div>
                                                            <div className="ua-row-name">{ru.name}</div>
                                                            <div className="ua-row-meta">{ru.company || 'No company'}</div>
                                                        </div>
                                                    </div>
                                                    <div className="ua-row-actions">
                                                        <select className="ua-select"
                                                            value={pa.role || ''}
                                                            onChange={e => setPendingApprove(prev => ({ ...prev, [ru.id]: { ...pa, role: e.target.value } }))}>
                                                            <option value="" disabled>Re-approve as…</option>
                                                            <option value="contractor">Contractor</option>
                                                            <option value="consultant">Consultant</option>
                                                            <option value="admin">Admin</option>
                                                        </select>
                                                        <button className="ua-btn ua-btn-primary" onClick={() => approveUser(ru.id, ru.name)}>
                                                            <UserCheck size={14} /> Approve
                                                        </button>
                                                        <button className="ua-btn ua-btn-danger-ghost" onClick={() => archiveUser(ru.id, ru.name)} title="Remove">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── UNASSIGNED USERS ── */}
                        {unassignedUsers.length > 0 && (
                            <div className="ua-block">
                                <div className="ua-block-header">
                                    <div className="ua-block-label">
                                        <span className="ua-count">{unassignedUsers.length}</span>
                                        Unassigned — Not in Any Project
                                    </div>
                                </div>
                                <p className="ua-hint">Approved users waiting to be added to a project.</p>
                                <div className="ua-list">
                                    {unassignedUsers.map(u => (
                                        <div key={u.id} className="ua-row">
                                            <div className="ua-row-user">
                                                <UserAvatar name={u.name} size={36} />
                                                <div>
                                                    <div className="ua-row-name">{u.name}</div>
                                                    <div className="ua-row-meta">
                                                        {u.company || 'No company'} · <span className="ua-role-badge">{u.role}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="ua-row-actions">
                                                <select className="ua-select"
                                                    value={assignProject[u.id] || ''}
                                                    onChange={e => setAssignProject(prev => ({ ...prev, [u.id]: e.target.value }))}>
                                                    <option value="" disabled>Project…</option>
                                                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                </select>
                                                <button className="ua-btn ua-btn-primary" onClick={() => assignUnassignedUser(u.id, u.name)}>
                                                    <FolderPlus size={14} /> Assign
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── PROJECT TEAMS ── */}
                        <div className="ua-block">
                            <div className="ua-block-header">
                                <div className="ua-block-label">Project Team</div>
                                <select className="ua-select ua-select-wide"
                                    value={effectiveTeamProjectId}
                                    onChange={e => setTeamProjectId(e.target.value)}>
                                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>

                            {teamUsers.length === 0 ? (
                                <p className="ua-hint" style={{ padding: '0.75rem 0 0.25rem' }}>No members in this project. Add someone below.</p>
                            ) : (
                                <div className="ua-team-list">
                                    {teamUsers.map(m => (
                                        <div key={m.id} className="ua-team-row">
                                            <UserAvatar name={m.name} size={30} />
                                            <span className="ua-team-name">{m.name}</span>
                                            <span className="ua-role-badge">{m.memberRole}</span>
                                            <span className="ua-team-company">{m.company || ''}</span>
                                            {m.id !== user.id && (
                                                <button className="ua-btn ua-btn-icon" onClick={() => handleRemoveTeamMember(m.id)} title="Remove from project">
                                                    <X size={14} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {addableUsers.length > 0 && (
                                <div className="ua-team-add">
                                    <select className="ua-select" style={{ flex: 2, minWidth: 0 }}
                                        value={addMemberUserId}
                                        onChange={e => setAddMemberUserId(e.target.value)}>
                                        <option value="">Add member…</option>
                                        {addableUsers.map(u => (
                                            <option key={u.id} value={u.id}>{u.name} — {u.role}</option>
                                        ))}
                                    </select>
                                    <select className="ua-select" value={addMemberRole}
                                        onChange={e => setAddMemberRole(e.target.value)}>
                                        <option value="contractor">Contractor</option>
                                        <option value="consultant">Consultant</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                    <button className="ua-btn ua-btn-primary" onClick={handleAddTeamMember}>
                                        <UserPlus size={14} /> Add
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Link to full Users directory */}
                        <div className="ua-link-row">
                            <button className="ua-btn ua-btn-outline" onClick={() => navigate('/admin/users')}>
                                <Users size={14} /> View All Members
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
