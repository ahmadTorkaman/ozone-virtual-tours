import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { listProjects, type Project } from '@/services/tauri';

export function SidebarLayout() {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    listProjects()
      .then(setProjects)
      .catch(() => {});
  }, []);

  const recentProjects = projects
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5)
    .map((p) => ({ id: p.id, name: p.name }));

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-base">
      <Sidebar
        projectCount={projects.length}
        recentProjects={recentProjects}
      />
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
