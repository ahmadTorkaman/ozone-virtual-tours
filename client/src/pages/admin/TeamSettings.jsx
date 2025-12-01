// ===========================================
// Team Settings Page
// ===========================================

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { settingsApi, authApi } from '../../services/api';
import {
  Users,
  UserPlus,
  Copy,
  Check,
  Trash2,
  Loader2,
  Link as LinkIcon,
  Clock,
  Mail,
} from 'lucide-react';

export default function TeamSettings() {
  const { user: currentUser, isAdmin } = useAuth();
  const [team, setTeam] = useState([]);
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [creating, setCreating] = useState(false);
  const [newInvite, setNewInvite] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [teamRes, invitesRes] = await Promise.all([
        settingsApi.getTeam(),
        authApi.listInvites(),
      ]);
      setTeam(teamRes.users || []);
      setInvites(invitesRes.invites || []);
    } catch (err) {
      console.error('Failed to load team data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvite = async () => {
    try {
      setCreating(true);
      const { invite } = await authApi.createInvite(inviteEmail || null);
      setNewInvite(invite);
      setInviteEmail('');
      loadData();
    } catch (err) {
      console.error('Failed to create invite:', err);
      alert('Failed to create invite. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleCopyInvite = (url) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRevokeInvite = async (id) => {
    if (!confirm('Are you sure you want to revoke this invite?')) return;

    try {
      await authApi.revokeInvite(id);
      loadData();
    } catch (err) {
      console.error('Failed to revoke invite:', err);
    }
  };

  const handleRemoveMember = async (id) => {
    const member = team.find(m => m.id === id);
    if (!confirm(`Are you sure you want to remove ${member?.name} from the team?`)) return;

    try {
      await settingsApi.removeTeamMember(id);
      loadData();
    } catch (err) {
      console.error('Failed to remove member:', err);
      alert('Failed to remove team member.');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isExpired = (date) => new Date(date) < new Date();

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="team-settings">
      <div className="page-header">
        <div>
          <h1 className="page-title">Team Settings</h1>
          <p className="page-subtitle">Manage your team members and invitations</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowInviteModal(true)}
        >
          <UserPlus size={18} />
          Invite Member
        </button>
      </div>

      {/* Team Members */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 className="card-title">
          <Users size={20} style={{ marginRight: '0.5rem' }} />
          Team Members ({team.length})
        </h2>

        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Role</th>
                <th>Joined</th>
                {isAdmin && <th></th>}
              </tr>
            </thead>
            <tbody>
              {team.map((member) => (
                <tr key={member.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div className="member-avatar">
                        {member.avatar ? (
                          <img src={member.avatar} alt={member.name} />
                        ) : (
                          <span>{member.name.charAt(0)}</span>
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500 }}>
                          {member.name}
                          {member.id === currentUser?.id && (
                            <span className="badge badge-info" style={{ marginLeft: '0.5rem' }}>You</span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          {member.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${member.role === 'ADMIN' ? 'badge-info' : 'badge-success'}`}>
                      {member.role}
                    </span>
                  </td>
                  <td style={{ color: 'var(--color-text-muted)' }}>
                    {formatDate(member.createdAt)}
                  </td>
                  {isAdmin && (
                    <td>
                      {member.id !== currentUser?.id && (
                        <button
                          className="btn btn-danger"
                          style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}
                          onClick={() => handleRemoveMember(member.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending Invites */}
      <div className="card">
        <h2 className="card-title">
          <LinkIcon size={20} style={{ marginRight: '0.5rem' }} />
          Pending Invites ({invites.filter(i => !i.usedAt && !isExpired(i.expiresAt)).length})
        </h2>

        {invites.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)' }}>No pending invites</p>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Expires</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {invites.map((invite) => {
                  const expired = isExpired(invite.expiresAt);
                  const used = !!invite.usedAt;

                  return (
                    <tr key={invite.id}>
                      <td>
                        {invite.email || (
                          <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                            Any email
                          </span>
                        )}
                      </td>
                      <td>
                        {used ? (
                          <span className="badge badge-success">Used</span>
                        ) : expired ? (
                          <span className="badge badge-danger">Expired</span>
                        ) : (
                          <span className="badge badge-warning">Pending</span>
                        )}
                      </td>
                      <td style={{ color: 'var(--color-text-muted)' }}>
                        <Clock size={14} style={{ marginRight: '0.25rem', verticalAlign: 'middle' }} />
                        {formatDate(invite.expiresAt)}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {!used && !expired && (
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}
                              onClick={() => handleCopyInvite(`${window.location.origin}/register/${invite.token}`)}
                            >
                              <Copy size={14} />
                            </button>
                          )}
                          {!used && (
                            <button
                              className="btn btn-danger"
                              style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}
                              onClick={() => handleRevokeInvite(invite.id)}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="modal-overlay" onClick={() => !newInvite && setShowInviteModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            {newInvite ? (
              <>
                <h2 className="modal-title">Invite Created!</h2>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                  Share this link with your team member:
                </p>
                <div className="invite-link-box">
                  <input
                    type="text"
                    value={newInvite.url}
                    readOnly
                    className="form-input"
                  />
                  <button
                    className="btn btn-primary"
                    onClick={() => handleCopyInvite(newInvite.url)}
                  >
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                  </button>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '1rem' }}>
                  This link expires on {formatDate(newInvite.expiresAt)}
                </p>
                <button
                  className="btn btn-secondary"
                  style={{ width: '100%', marginTop: '1rem' }}
                  onClick={() => { setShowInviteModal(false); setNewInvite(null); }}
                >
                  Done
                </button>
              </>
            ) : (
              <>
                <h2 className="modal-title">Invite Team Member</h2>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
                  Create an invite link to add a new team member.
                </p>

                <div className="form-group">
                  <label className="form-label">
                    <Mail size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                    Email Address (optional)
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="form-input"
                    placeholder="colleague@company.com"
                  />
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                    Leave empty to create a link anyone can use
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <button
                    className="btn btn-secondary"
                    style={{ flex: 1 }}
                    onClick={() => setShowInviteModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                    onClick={handleCreateInvite}
                    disabled={creating}
                  >
                    {creating ? (
                      <Loader2 size={18} className="spinner-icon" />
                    ) : (
                      <>
                        <UserPlus size={18} />
                        Create Invite
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        .member-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
          overflow: hidden;
        }

        .member-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          z-index: 1000;
        }

        .modal {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 16px;
          padding: 1.5rem;
          width: 100%;
          max-width: 420px;
        }

        .modal-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--color-text);
          margin: 0 0 0.5rem;
        }

        .invite-link-box {
          display: flex;
          gap: 0.5rem;
        }

        .invite-link-box .form-input {
          flex: 1;
          font-size: 0.875rem;
        }
      `}</style>
    </div>
  );
}
