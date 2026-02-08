import { type ReactNode, useState } from 'react';

interface PanelProps {
  children: ReactNode;
  className?: string;
}

export function Panel({ children, className = '' }: PanelProps) {
  return (
    <div className={`bg-surface border-r border-border-subtle flex flex-col h-full overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

interface PanelHeaderProps {
  title: string;
  actions?: ReactNode;
  className?: string;
}

export function PanelHeader({ title, actions, className = '' }: PanelHeaderProps) {
  return (
    <div className={`flex items-center justify-between px-3 py-2.5 border-b border-border-subtle flex-shrink-0 ${className}`}>
      <h2 className="text-xs font-semibold text-txt-secondary uppercase tracking-wider">{title}</h2>
      {actions && <div className="flex items-center gap-1">{actions}</div>}
    </div>
  );
}

interface PanelSectionProps {
  title?: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function PanelSection({
  title,
  collapsible = false,
  defaultOpen = true,
  actions,
  children,
  className = '',
}: PanelSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`border-b border-border-subtle ${className}`}>
      {title && (
        <div
          className={`flex items-center justify-between px-3 py-2 ${collapsible ? 'cursor-pointer hover:bg-hovr' : ''}`}
          onClick={collapsible ? () => setIsOpen(!isOpen) : undefined}
        >
          <div className="flex items-center gap-1.5">
            {collapsible && (
              <svg
                className={`w-3 h-3 text-txt-tertiary transition-transform ${isOpen ? 'rotate-90' : ''}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            )}
            <span className="text-xs font-medium text-txt-tertiary uppercase tracking-wider">{title}</span>
          </div>
          {actions && <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>{actions}</div>}
        </div>
      )}
      {(!collapsible || isOpen) && <div className="px-3 pb-3">{children}</div>}
    </div>
  );
}

interface PanelBodyProps {
  children: ReactNode;
  className?: string;
}

export function PanelBody({ children, className = '' }: PanelBodyProps) {
  return (
    <div className={`flex-1 overflow-y-auto ${className}`}>
      {children}
    </div>
  );
}
