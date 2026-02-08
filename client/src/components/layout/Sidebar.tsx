import { useNavigate, useLocation } from 'react-router-dom';
import { FolderOpen, Palette, Settings, Sparkles, HelpCircle } from 'lucide-react';
import { useLicenseStore } from '@/stores/licenseStore';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  path: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}

function NavItem({ icon, label, count, active, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded text-sm transition-colors ${
        active
          ? 'bg-accent-muted text-accent'
          : 'text-txt-secondary hover:text-txt-primary hover:bg-hovr'
      }`}
    >
      <span className="flex-shrink-0">{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      {count !== undefined && (
        <span className="text-xs text-txt-tertiary tabular-nums">{count}</span>
      )}
    </button>
  );
}

interface RecentProject {
  id: string;
  name: string;
}

interface SidebarProps {
  projectCount?: number;
  materialCount?: number;
  recentProjects?: RecentProject[];
}

export function Sidebar({ projectCount, materialCount, recentProjects = [] }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { license } = useLicenseStore();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const tierLabel = license?.tier
    ? license.tier.charAt(0).toUpperCase() + license.tier.slice(1).toLowerCase()
    : 'Trial';

  return (
    <aside className="w-[220px] bg-surface border-r border-border-subtle flex flex-col h-full flex-shrink-0">
      {/* Brand */}
      <div className="px-4 py-4 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-md bg-accent flex items-center justify-center">
          <span className="text-white text-sm font-bold">O</span>
        </div>
        <span className="text-sm font-semibold text-txt-primary tracking-tight">Ozone Studio</span>
      </div>

      {/* Main Nav */}
      <nav className="px-2 flex flex-col gap-0.5">
        <NavItem
          icon={<FolderOpen size={16} />}
          label="Projects"
          path="/"
          count={projectCount}
          active={isActive('/') && !location.pathname.startsWith('/settings')}
          onClick={() => navigate('/')}
        />
        <NavItem
          icon={<Palette size={16} />}
          label="Materials"
          path="/materials"
          count={materialCount}
          active={isActive('/materials')}
          onClick={() => navigate('/materials')}
        />
      </nav>

      {/* Recent Projects */}
      {recentProjects.length > 0 && (
        <div className="mt-5 px-2">
          <div className="px-3 mb-1.5">
            <span className="text-xs font-medium text-txt-tertiary uppercase tracking-wider">Recent</span>
          </div>
          <div className="flex flex-col gap-0.5">
            {recentProjects.slice(0, 5).map((project) => (
              <button
                key={project.id}
                onClick={() => navigate(`/projects/${project.id}`)}
                className="w-full text-left px-3 py-1 rounded text-sm text-txt-secondary hover:text-txt-primary hover:bg-hovr transition-colors truncate"
              >
                {project.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom Nav */}
      <div className="px-2 pb-2 flex flex-col gap-0.5">
        <NavItem
          icon={<Sparkles size={16} />}
          label="What's New"
          path="/whats-new"
          active={false}
          onClick={() => {}}
        />
        <NavItem
          icon={<HelpCircle size={16} />}
          label="Help"
          path="/help"
          active={false}
          onClick={() => {}}
        />
        <NavItem
          icon={<Settings size={16} />}
          label="Settings"
          path="/settings"
          active={isActive('/settings')}
          onClick={() => navigate('/settings')}
        />

        {/* User Card */}
        <div className="mt-2 mx-1 px-3 py-2 rounded-md bg-raised border border-border-subtle">
          <div className="text-xs font-medium text-txt-primary">Ozone Studio</div>
          <div className="text-xs text-txt-tertiary mt-0.5">{tierLabel} License</div>
        </div>
      </div>
    </aside>
  );
}
