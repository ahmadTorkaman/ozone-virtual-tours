import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ icon, className = '', ...props }, ref) => {
    if (icon) {
      return (
        <div className="relative">
          <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-txt-tertiary pointer-events-none">
            {icon}
          </div>
          <input
            ref={ref}
            className={`w-full bg-raised text-txt-primary text-sm pl-8 pr-3 py-1.5 rounded border border-border focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-border-focus placeholder:text-txt-tertiary transition-colors ${className}`}
            {...props}
          />
        </div>
      );
    }

    return (
      <input
        ref={ref}
        className={`w-full bg-raised text-txt-primary text-sm px-3 py-1.5 rounded border border-border focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-border-focus placeholder:text-txt-tertiary transition-colors ${className}`}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ value, onClear, className = '', ...props }, ref) => {
    return (
      <div className="relative">
        <svg
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-txt-tertiary pointer-events-none"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          ref={ref}
          type="text"
          value={value}
          className={`w-full bg-raised text-txt-primary text-sm pl-8 pr-8 py-1.5 rounded border border-border focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-border-focus placeholder:text-txt-tertiary transition-colors ${className}`}
          {...props}
        />
        {value && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-txt-tertiary hover:text-txt-secondary transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        )}
      </div>
    );
  }
);

SearchInput.displayName = 'SearchInput';
