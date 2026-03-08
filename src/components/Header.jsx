import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import { LogOut, Menu, X, Building } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import UserAvatar from './UserAvatar';

export default function Header() {
    const { user, logout } = useAuth();
    const { projects, activeProject, changeActiveProject } = useProject();
    const navigate = useNavigate();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);

    if (!user) return null;

    const isContractor = user.role === 'contractor';
    const dashPath = isContractor ? '/contractor' : '/consultant';

    return (
        <header className="app-header">
            <div className="header-left" onClick={() => navigate(dashPath)}>
                <span className="app-title-logo"><span className="brand-accent">Clear</span>Line</span>
                <span className="app-title">Inspections</span>
            </div>

            {/* Project Selector */}
            {activeProject && (
                <div className="header-project-selector" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto', marginRight: '2rem' }}>
                    <Building size={16} color="var(--clr-text-muted)" />
                    <select
                        value={activeProject.id}
                        onChange={(e) => changeActiveProject(e.target.value)}
                        style={{ border: 'none', background: 'transparent', fontSize: '0.9rem', fontWeight: '500', color: 'var(--clr-text-main)', outline: 'none', cursor: 'pointer' }}
                    >
                        {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>
            )}

            <div className="header-user-info" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.1rem' }}>
                    <span className="header-username" style={{ fontWeight: '600', fontSize: '0.9rem' }}>{user.name}</span>
                    <span className="header-role-badge" data-role={user.role} style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', marginTop: 0 }}>
                        {isContractor ? 'Contractor' : 'Consultant'}
                    </span>
                </div>
                <UserAvatar name={user.name} size={36} />
            </div>

            <button className="header-menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
                {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {menuOpen && (
                <div className="header-dropdown">
                    <div className="header-dropdown-info" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <UserAvatar name={user.name} size={48} />
                        <div>
                            <strong>{user.name}</strong>
                            <span>{user.company}</span>
                            <span className="header-role-badge" data-role={user.role}>
                                {isContractor ? 'Contractor' : 'Consultant'}
                            </span>
                        </div>
                    </div>
                    <hr />
                    <button
                        onClick={() => { navigate(dashPath); setMenuOpen(false); }}
                        className={`header-dropdown-item ${location.pathname === dashPath ? 'active' : ''}`}
                    >
                        Dashboard
                    </button>
                    {isContractor && (
                        <button
                            onClick={() => { navigate('/contractor/rfi-sheet'); setMenuOpen(false); }}
                            className={`header-dropdown-item ${location.pathname.includes('rfi-sheet') ? 'active' : ''}`}
                        >
                            Daily RFI Sheet
                        </button>
                    )}
                    {!isContractor && (
                        <button
                            onClick={() => { navigate('/consultant/review'); setMenuOpen(false); }}
                            className={`header-dropdown-item ${location.pathname.includes('review') ? 'active' : ''}`}
                        >
                            Review Queue
                        </button>
                    )}
                    <hr />
                    <button onClick={() => { logout(); navigate('/'); }} className="header-dropdown-item logout">
                        <LogOut size={16} /> Sign Out
                    </button>
                </div>
            )}
        </header>
    );
}
