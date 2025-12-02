// ===========================================
// Tours List Page
// ===========================================

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toursApi } from '../../services/api';
import {
  Plus,
  Search,
  Map,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  ExternalLink,
  Copy,
  Loader2,
} from 'lucide-react';
import './Tours.css';

export default function Tours() {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all, published, draft
  const [openMenu, setOpenMenu] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadTours();
  }, []);

  const loadTours = async () => {
    try {
      setLoading(true);
      const { tours } = await toursApi.list();
      setTours(tours || []);
    } catch (err) {
      console.error('Failed to load tours:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublish = async (tour) => {
    try {
      if (tour.isPublished) {
        await toursApi.unpublish(tour.id);
      } else {
        await toursApi.publish(tour.id);
      }
      loadTours();
    } catch (err) {
      console.error('Failed to toggle publish:', err);
    }
    setOpenMenu(null);
  };

  const handleDelete = async (tour) => {
    if (!confirm(`Are you sure you want to delete "${tour.name}"? This cannot be undone.`)) {
      return;
    }

    try {
      setDeleting(tour.id);
      await toursApi.delete(tour.id);
      loadTours();
    } catch (err) {
      console.error('Failed to delete tour:', err);
    } finally {
      setDeleting(null);
    }
    setOpenMenu(null);
  };

  const handleCopyLink = (tour) => {
    const url = `${window.location.origin}/tour/${tour.slug}`;
    navigator.clipboard.writeText(url);
    setOpenMenu(null);
    // Could add a toast notification here
  };

  const filteredTours = tours.filter((tour) => {
    const matchesSearch = tour.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          tour.clientName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' ||
                          (filter === 'published' && tour.isPublished) ||
                          (filter === 'draft' && !tour.isPublished);
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="tours-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Tours</h1>
          <p className="page-subtitle">Manage your virtual tours</p>
        </div>
        <Link to="/admin/tours/new" className="btn btn-primary">
          <Plus size={18} />
          Create Tour
        </Link>
      </div>

      {/* Filters */}
      <div className="tours-filters">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search tours..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input search-input"
          />
        </div>

        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({tours.length})
          </button>
          <button
            className={`filter-tab ${filter === 'published' ? 'active' : ''}`}
            onClick={() => setFilter('published')}
          >
            Published ({tours.filter(t => t.isPublished).length})
          </button>
          <button
            className={`filter-tab ${filter === 'draft' ? 'active' : ''}`}
            onClick={() => setFilter('draft')}
          >
            Drafts ({tours.filter(t => !t.isPublished).length})
          </button>
        </div>
      </div>

      {/* Tours Grid */}
      {filteredTours.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Map size={48} className="empty-state-icon" />
            <h3 className="empty-state-title">
              {searchQuery || filter !== 'all' ? 'No matching tours' : 'No tours yet'}
            </h3>
            <p className="empty-state-text">
              {searchQuery || filter !== 'all'
                ? 'Try adjusting your search or filter'
                : 'Create your first virtual tour to get started.'}
            </p>
            {!searchQuery && filter === 'all' && (
              <Link to="/admin/tours/new" className="btn btn-primary">
                <Plus size={18} />
                Create Tour
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="tours-grid">
          {filteredTours.map((tour) => (
            <div key={tour.id} className="tour-card">
              <div
                className="tour-thumbnail"
                onClick={() => navigate(`/admin/tours/${tour.id}`)}
              >
                {tour.thumbnail ? (
                  <img src={tour.thumbnail} alt={tour.name} />
                ) : (
                  <div className="tour-thumbnail-placeholder">
                    <Map size={32} />
                  </div>
                )}
                <span className={`tour-status ${tour.isPublished ? 'published' : 'draft'}`}>
                  {tour.isPublished ? 'Published' : 'Draft'}
                </span>
              </div>

              <div className="tour-info">
                <h3 className="tour-name">{tour.name}</h3>
                <p className="tour-meta">
                  {tour.clientName && <span>{tour.clientName} • </span>}
                  <span>{tour.scenes?.length || 0} scenes</span>
                </p>
                <p className="tour-slug">/{tour.slug}</p>
              </div>

              <div className="tour-actions">
                <Link
                  to={`/admin/tours/${tour.id}`}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  <Edit size={16} />
                  Edit
                </Link>

                <div className="dropdown">
                  <button
                    className="btn btn-secondary icon-only"
                    onClick={() => setOpenMenu(openMenu === tour.id ? null : tour.id)}
                  >
                    <MoreVertical size={16} />
                  </button>

                  {openMenu === tour.id && (
                    <div className="dropdown-menu">
                      <button
                        className="dropdown-item"
                        onClick={() => handleCopyLink(tour)}
                      >
                        <Copy size={16} />
                        Copy Link
                      </button>
                      {tour.isPublished && (
                        <a
                          href={`/tour/${tour.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="dropdown-item"
                          onClick={() => setOpenMenu(null)}
                        >
                          <ExternalLink size={16} />
                          View Tour
                        </a>
                      )}
                      <button
                        className="dropdown-item"
                        onClick={() => handleTogglePublish(tour)}
                      >
                        {tour.isPublished ? (
                          <>
                            <EyeOff size={16} />
                            Unpublish
                          </>
                        ) : (
                          <>
                            <Eye size={16} />
                            Publish
                          </>
                        )}
                      </button>
                      <div className="dropdown-divider" />
                      <button
                        className="dropdown-item danger"
                        onClick={() => handleDelete(tour)}
                        disabled={deleting === tour.id}
                      >
                        {deleting === tour.id ? (
                          <Loader2 size={16} className="spinner-icon" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Click outside to close menu */}
      {openMenu && (
        <div
          className="menu-overlay"
          onClick={() => setOpenMenu(null)}
        />
      )}
    </div>
  );
}
