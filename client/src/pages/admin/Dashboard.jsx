// ===========================================
// Admin Dashboard Page
// ===========================================

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { settingsApi, toursApi } from '../../services/api';
import { Map, Users, Eye, Plus, ArrowRight, Loader2 } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentTours, setRecentTours] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, toursRes] = await Promise.all([
        settingsApi.getTeamStats(),
        toursApi.list({ limit: 5 }),
      ]);
      setStats(statsRes.stats);
      setRecentTours(toursRes.tours || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1 className="page-title">Welcome back, {user?.name?.split(' ')[0]}!</h1>
        <p className="page-subtitle">Here's what's happening with your virtual tours.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-3" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <Map size={24} style={{ color: 'var(--color-primary)', marginBottom: '0.5rem' }} />
          <div className="stat-value">{stats?.totalTours || 0}</div>
          <div className="stat-label">Total Tours</div>
        </div>

        <div className="stat-card">
          <Eye size={24} style={{ color: 'var(--color-secondary)', marginBottom: '0.5rem' }} />
          <div className="stat-value">{stats?.publishedTours || 0}</div>
          <div className="stat-label">Published Tours</div>
        </div>

        <div className="stat-card">
          <Users size={24} style={{ color: '#22c55e', marginBottom: '0.5rem' }} />
          <div className="stat-value">{stats?.teamMembers || 0}</div>
          <div className="stat-label">Team Members</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2 className="card-title">Quick Actions</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link to="/admin/tours/new" className="btn btn-primary">
            <Plus size={18} />
            Create New Tour
          </Link>
          <Link to="/admin/tours" className="btn btn-secondary">
            <Map size={18} />
            View All Tours
          </Link>
        </div>
      </div>

      {/* Recent Tours */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 className="card-title" style={{ margin: 0 }}>Recent Tours</h2>
          <Link to="/admin/tours" className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>
            View All
            <ArrowRight size={16} />
          </Link>
        </div>

        {recentTours.length === 0 ? (
          <div className="empty-state">
            <Map size={48} className="empty-state-icon" />
            <h3 className="empty-state-title">No tours yet</h3>
            <p className="empty-state-text">Create your first virtual tour to get started.</p>
            <Link to="/admin/tours/new" className="btn btn-primary">
              <Plus size={18} />
              Create Tour
            </Link>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Client</th>
                  <th>Status</th>
                  <th>Scenes</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {recentTours.map((tour) => (
                  <tr key={tour.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{tour.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        /{tour.slug}
                      </div>
                    </td>
                    <td>{tour.clientName || '-'}</td>
                    <td>
                      <span className={`badge ${tour.isPublished ? 'badge-success' : 'badge-warning'}`}>
                        {tour.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td>{tour.scenes?.length || 0}</td>
                    <td>
                      <Link
                        to={`/admin/tours/${tour.id}`}
                        className="btn btn-secondary"
                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
