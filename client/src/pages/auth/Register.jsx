// ===========================================
// Register Page (with invite token)
// ===========================================

import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useBranding } from '../../contexts/BrandingContext';
import { authApi } from '../../services/api';
import { User, Mail, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import './Auth.css';

export default function Register() {
  const { token } = useParams();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [inviteValid, setInviteValid] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [error, setError] = useState('');

  const { register, isAuthenticated } = useAuth();
  const { branding } = useBranding();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin');
    }
  }, [isAuthenticated, navigate]);

  // Validate invite token
  useEffect(() => {
    validateInvite();
  }, [token]);

  const validateInvite = async () => {
    try {
      setValidating(true);
      const { valid, email: inviteEmail } = await authApi.validateInvite(token);
      setInviteValid(valid);
      if (inviteEmail) {
        setEmail(inviteEmail);
      }
    } catch (err) {
      setInviteError(err.message || 'Invalid invite link');
      setInviteValid(false);
    } finally {
      setValidating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register({ token, email, name });
      navigate('/admin');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="auth-page">
        <div className="auth-loading">
          <Loader2 className="spinner-icon" size={32} />
          <p>Validating invite...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          {branding.companyLogo ? (
            <img src={branding.companyLogo} alt={branding.companyName} className="auth-logo" />
          ) : (
            <h1 className="auth-brand">{branding.companyName}</h1>
          )}
          <p className="auth-subtitle">Virtual Tours Admin</p>
        </div>

        {!inviteValid ? (
          <div className="auth-error-state">
            <AlertCircle size={48} className="error-icon" />
            <h2 className="auth-title">Invalid Invite</h2>
            <p className="auth-text">{inviteError}</p>
            <Link to="/login" className="btn btn-secondary">
              Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <h2 className="auth-title">Create Account</h2>
            <p className="auth-text">Complete your registration to join the team.</p>

            {error && <div className="auth-error">{error}</div>}

            <div className="form-group">
              <label htmlFor="name" className="form-label">Full Name</label>
              <div className="input-with-icon">
                <User size={18} className="input-icon" />
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-input"
                  placeholder="John Doe"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-label">Email Address</label>
              <div className="input-with-icon">
                <Mail size={18} className="input-icon" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  placeholder="you@company.com"
                  required
                  readOnly={!!email} // Read-only if pre-filled from invite
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={18} className="spinner-icon" />
                  Creating account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            <p className="auth-footer-text">
              Already have an account? <Link to="/login">Sign in</Link>
            </p>
          </form>
        )}

        <div className="auth-footer">
          <span className="powered-by">{branding.poweredByText}</span>
        </div>
      </div>
    </div>
  );
}
