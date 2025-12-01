// ===========================================
// Login Page
// ===========================================

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useBranding } from '../../contexts/BrandingContext';
import { authApi } from '../../services/api';
import { Mail, ArrowRight, Loader2 } from 'lucide-react';
import './Auth.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingBootstrap, setCheckingBootstrap] = useState(true);
  const [bootstrapToken, setBootstrapToken] = useState(null);
  const [error, setError] = useState('');

  const { login, isAuthenticated } = useAuth();
  const { branding } = useBranding();
  const navigate = useNavigate();

  // Check if this is first-time setup
  useEffect(() => {
    checkBootstrap();
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin');
    }
  }, [isAuthenticated, navigate]);

  const checkBootstrap = async () => {
    try {
      const { needsBootstrap, inviteToken } = await authApi.bootstrap();
      if (needsBootstrap && inviteToken) {
        setBootstrapToken(inviteToken);
      }
    } catch (err) {
      console.error('Bootstrap check failed:', err);
    } finally {
      setCheckingBootstrap(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email);
      navigate('/admin');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  if (checkingBootstrap) {
    return (
      <div className="auth-page">
        <div className="auth-loading">
          <Loader2 className="spinner-icon" size={32} />
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

        {bootstrapToken ? (
          <div className="auth-bootstrap">
            <h2 className="auth-title">Welcome!</h2>
            <p className="auth-text">
              This is your first time here. Create an admin account to get started.
            </p>
            <Link to={`/register/${bootstrapToken}`} className="btn btn-primary btn-block">
              Create Admin Account
              <ArrowRight size={18} />
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <h2 className="auth-title">Sign In</h2>

            {error && <div className="auth-error">{error}</div>}

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
                  autoFocus
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={18} className="spinner-icon" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            <p className="auth-footer-text">
              Don't have an account? Contact your administrator for an invite link.
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
