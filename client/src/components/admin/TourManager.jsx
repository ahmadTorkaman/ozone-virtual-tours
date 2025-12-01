import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, ExternalLink } from 'lucide-react';

const TourManager = () => {
  const [tours, setTours] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchTours();
  }, []);

  const fetchTours = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/tours');
      if (!response.ok) throw new Error('Failed to fetch tours');
      const data = await response.json();
      setTours(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const createTour = async (tourData) => {
    try {
      const response = await fetch('/api/tours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tourData)
      });
      if (!response.ok) throw new Error('Failed to create tour');
      const newTour = await response.json();
      setTours([newTour, ...tours]);
      setShowCreateModal(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteTour = async (tourId) => {
    if (!confirm('Are you sure you want to delete this tour?')) return;
    
    try {
      const response = await fetch(`/api/tours/${tourId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete tour');
      setTours(tours.filter(t => t.id !== tourId));
    } catch (err) {
      setError(err.message);
    }
  };

  const togglePublish = async (tour) => {
    try {
      const endpoint = tour.isPublished ? 'unpublish' : 'publish';
      const response = await fetch(`/api/tours/${tour.id}/${endpoint}`, { method: 'POST' });
      if (!response.ok) throw new Error('Failed to update tour');
      const updated = await response.json();
      setTours(tours.map(t => t.id === tour.id ? updated : t));
    } catch (err) {
      setError(err.message);
    }
  };

  if (isLoading) {
    return <div className="loading">Loading tours...</div>;
  }

  return (
    <div className="tour-manager">
      <div className="manager-header">
        <h1>Virtual Tours</h1>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          <Plus size={18} />
          New Tour
        </button>
      </div>

      {error && (
        <div className="error-banner">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className="tours-grid">
        {tours.length === 0 ? (
          <div className="empty-state">
            <p>No tours yet. Create your first virtual tour!</p>
            <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
              Create Tour
            </button>
          </div>
        ) : (
          tours.map(tour => (
            <div key={tour.id} className="tour-card">
              <div className="tour-thumbnail">
                {tour.thumbnail ? (
                  <img src={tour.thumbnail} alt={tour.name} />
                ) : (
                  <div className="placeholder-thumbnail">🏠</div>
                )}
                <div className="tour-status">
                  {tour.isPublished ? (
                    <span className="status-published">Published</span>
                  ) : (
                    <span className="status-draft">Draft</span>
                  )}
                </div>
              </div>
              
              <div className="tour-info">
                <h3>{tour.name}</h3>
                {tour.clientName && <p className="client-name">{tour.clientName}</p>}
                <p className="tour-meta">
                  {tour._count?.scenes || 0} scenes • {tour._count?.floorPlans || 0} floor plans
                </p>
              </div>

              <div className="tour-actions">
                <button 
                  className="btn btn-icon"
                  onClick={() => window.open(`/tour/${tour.id}`, '_blank')}
                  title="Preview"
                >
                  <ExternalLink size={16} />
                </button>
                <button 
                  className="btn btn-icon"
                  onClick={() => window.location.href = `/admin/tours/${tour.id}`}
                  title="Edit"
                >
                  <Edit size={16} />
                </button>
                <button 
                  className="btn btn-icon"
                  onClick={() => togglePublish(tour)}
                  title={tour.isPublished ? 'Unpublish' : 'Publish'}
                >
                  {tour.isPublished ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                <button 
                  className="btn btn-icon btn-danger"
                  onClick={() => deleteTour(tour.id)}
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Modal would go here */}
    </div>
  );
};

export default TourManager;
