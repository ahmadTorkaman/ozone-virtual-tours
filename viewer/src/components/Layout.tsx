import type { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
  showFooter?: boolean;
}

export function Layout({ children, showFooter = true }: LayoutProps) {
  return (
    <div className="min-h-[100dvh] bg-base flex flex-col">
      <div className="flex-1">{children}</div>
      {showFooter && (
        <footer className="py-4 text-center">
          <span className="text-xs text-txt-tertiary">
            Powered by Ozone Studio
          </span>
        </footer>
      )}
    </div>
  );
}
