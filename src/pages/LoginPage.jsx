import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { USER_ROLES } from '../utils/constants';
import { Eye, HardHat, UserCheck } from 'lucide-react';

export default function LoginPage() {
    const { login, register } = useAuth();
    const navigate = useNavigate();
    const [isRegister, setIsRegister] = useState(false);
    const [role, setRole] = useState(USER_ROLES.CONTRACTOR);
    const [form, setForm] = useState({ name: '', email: '', password: '', company: '' });
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');

        if (isRegister) {
            if (!form.name || !form.email || !form.password || !form.company) {
                setError('All fields are required');
                return;
            }
            const result = await register(form.name, form.email, form.password, role, form.company);
            if (result.success) {
                navigate(role === USER_ROLES.CONTRACTOR ? '/contractor' : '/consultant');
            } else {
                setError(result.error);
            }
        } else {
            if (!form.email || !form.password) {
                setError('Email and password are required');
                return;
            }
            const result = await login(form.email, form.password);
            if (result.success) {
                // Wait briefly for the session listener in AuthContext to fetch the profile
                setTimeout(() => {
                    navigate('/'); // Root router will redirect based on fetched role
                }, 500);
            } else {
                setError(result.error);
            }
        }
    }

    function handleChange(field, value) {
        setForm((prev) => ({ ...prev, [field]: value }));
        setError('');
    }

    return (
        <div className="login-page">
            <div className="login-hero">
                <div className="hero-overlay"></div>
                <div className="hero-content">
                    <div className="hero-logo">
                        <span className="brand-accent">Clear</span>Line
                    </div>
                    <div className="hero-text-container">
                        <h1 className="hero-headline">Build with Confidence.</h1>
                        <p className="hero-subheadline">
                            The enterprise platform for streamlined RFIs, inspections, and QA/QC management.
                        </p>
                    </div>
                </div>
            </div>

            <div className="login-form-side">
                <div className="login-container">
                    <div className="login-header-mobile">
                        <div className="login-logo-text">
                            <span className="brand-accent">Clear</span>Line
                        </div>
                    </div>

                    <div className="login-card">
                        <div className="login-tabs">
                            <button
                                className={`login-tab ${!isRegister ? 'active' : ''}`}
                                onClick={() => { setIsRegister(false); setError(''); }}
                            >
                                Sign In
                            </button>
                            <button
                                className={`login-tab ${isRegister ? 'active' : ''}`}
                                onClick={() => { setIsRegister(true); setError(''); }}
                            >
                                Register
                            </button>
                        </div>

                        {isRegister && (
                            <div className="role-selector">
                                <button
                                    className={`role-option ${role === USER_ROLES.CONTRACTOR ? 'active' : ''}`}
                                    onClick={() => setRole(USER_ROLES.CONTRACTOR)}
                                    type="button"
                                >
                                    <HardHat size={24} />
                                    <span>Contractor</span>
                                    <small>File & track RFIs</small>
                                </button>
                                <button
                                    className={`role-option ${role === USER_ROLES.CONSULTANT ? 'active' : ''}`}
                                    onClick={() => setRole(USER_ROLES.CONSULTANT)}
                                    type="button"
                                >
                                    <UserCheck size={24} />
                                    <span>Consultant</span>
                                    <small>Review & approve RFIs</small>
                                </button>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="login-form">
                            {isRegister && (
                                <>
                                    <div className="form-group">
                                        <label>Full Name</label>
                                        <input
                                            type="text"
                                            value={form.name}
                                            onChange={(e) => handleChange('name', e.target.value)}
                                            placeholder="Enter your full name"
                                            autoComplete="name"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Company Name</label>
                                        <input
                                            type="text"
                                            value={form.company}
                                            onChange={(e) => handleChange('company', e.target.value)}
                                            placeholder="Enter company name"
                                            autoComplete="organization"
                                        />
                                    </div>
                                </>
                            )}

                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => handleChange('email', e.target.value)}
                                    placeholder="you@company.com"
                                    autoComplete="email"
                                />
                            </div>

                            <div className="form-group">
                                <label>Password</label>
                                <div className="password-field">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={form.password}
                                        onChange={(e) => handleChange('password', e.target.value)}
                                        placeholder="Enter your password"
                                        autoComplete={isRegister ? 'new-password' : 'current-password'}
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        <Eye size={18} />
                                    </button>
                                </div>
                            </div>

                            {error && <div className="login-error">{error}</div>}

                            <button type="submit" className="btn btn-primary login-submit">
                                {isRegister ? 'Create Account' : 'Sign In'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
