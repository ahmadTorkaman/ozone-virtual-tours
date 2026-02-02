import { useEffect, useState } from 'react';
import { listProjects, createProject, deleteProject, type Project } from './services/tauri';

function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listProjects();
      setProjects(data);
    } catch (err) {
      setError(err as string);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    try {
      setError(null);
      const project = await createProject({
        name: `New Project ${projects.length + 1}`,
        description: 'Created from Ozone Studio',
      });
      setProjects([project, ...projects]);
    } catch (err) {
      setError(err as string);
    }
  };

  const handleDeleteProject = async (id: string) => {
    try {
      setError(null);
      await deleteProject(id);
      setProjects(projects.filter((p) => p.id !== id));
    } catch (err) {
      setError(err as string);
    }
  };

  return (
    <div className="app">
      <style>{`
        .app {
          min-height: 100vh;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          color: white;
          padding: 2rem;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
        }
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 2rem;
        }
        .header h1 {
          font-size: 2rem;
          font-weight: bold;
          margin: 0;
        }
        .header p {
          color: #a0a0a0;
          margin: 0.25rem 0 0;
        }
        .btn {
          padding: 0.75rem 1.5rem;
          border-radius: 0.5rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }
        .btn-primary {
          background: #6366f1;
          color: white;
        }
        .btn-primary:hover {
          background: #4f46e5;
        }
        .btn-danger {
          background: #ef4444;
          color: white;
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
        }
        .btn-danger:hover {
          background: #dc2626;
        }
        .error {
          background: rgba(239, 68, 68, 0.2);
          border: 1px solid #ef4444;
          color: #fca5a5;
          padding: 1rem;
          border-radius: 0.5rem;
          margin-bottom: 1.5rem;
        }
        .loading {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 3rem;
        }
        .spinner {
          width: 2rem;
          height: 2rem;
          border: 2px solid #6366f1;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .empty {
          text-align: center;
          padding: 3rem;
          color: #a0a0a0;
        }
        .empty p:first-child {
          font-size: 1.125rem;
        }
        .empty p:last-child {
          margin-top: 0.5rem;
          font-size: 0.875rem;
          color: #707070;
        }
        .project-list {
          display: grid;
          gap: 1rem;
        }
        .project-card {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 0.75rem;
          padding: 1.25rem;
          transition: background 0.2s;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .project-card:hover {
          background: rgba(255, 255, 255, 0.08);
        }
        .project-info h3 {
          font-weight: 500;
          font-size: 1.125rem;
          margin: 0;
        }
        .project-info .description {
          color: #a0a0a0;
          font-size: 0.875rem;
          margin: 0.25rem 0 0;
        }
        .project-info .date {
          color: #707070;
          font-size: 0.75rem;
          margin: 0.5rem 0 0;
        }
        .footer {
          margin-top: 3rem;
          text-align: center;
          color: #707070;
          font-size: 0.875rem;
        }
        .footer p {
          margin: 0.25rem 0;
        }
      `}</style>

      <div className="container">
        <div className="header">
          <div>
            <h1>Ozone Studio</h1>
            <p>3D Scene Viewer for Interior Designers</p>
          </div>
          <button className="btn btn-primary" onClick={handleCreateProject}>
            New Project
          </button>
        </div>

        {error && <div className="error">{error}</div>}

        {loading ? (
          <div className="loading">
            <div className="spinner" />
          </div>
        ) : projects.length === 0 ? (
          <div className="empty">
            <p>No projects yet</p>
            <p>Create your first project to get started</p>
          </div>
        ) : (
          <div className="project-list">
            {projects.map((project) => (
              <div key={project.id} className="project-card">
                <div className="project-info">
                  <h3>{project.name}</h3>
                  {project.description && (
                    <p className="description">{project.description}</p>
                  )}
                  <p className="date">
                    Created: {new Date(project.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  className="btn btn-danger"
                  onClick={() => handleDeleteProject(project.id)}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="footer">
          <p>Phase 1 Complete - Tauri Foundation Ready</p>
          <p>SQLite + Rust Backend + React Frontend</p>
        </div>
      </div>
    </div>
  );
}

export default App;
