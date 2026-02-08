interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

const sizeStyles = {
  sm: { track: 'w-7 h-4', thumb: 'w-3 h-3', translate: 'translate-x-3' },
  md: { track: 'w-9 h-5', thumb: 'w-3.5 h-3.5', translate: 'translate-x-4' },
};

export function Toggle({ checked, onChange, label, disabled = false, size = 'md' }: ToggleProps) {
  const s = sizeStyles[size];

  return (
    <label className={`inline-flex items-center gap-2 ${disabled ? 'opacity-40 pointer-events-none' : 'cursor-pointer'}`}>
      <button
        role="switch"
        type="button"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        disabled={disabled}
        className={`relative inline-flex items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50 ${s.track} ${
          checked ? 'bg-accent' : 'bg-hovr'
        }`}
      >
        <span
          className={`inline-block rounded-full bg-white transition-transform ${s.thumb} ${
            checked ? s.translate : 'translate-x-0.5'
          }`}
        />
      </button>
      {label && <span className="text-sm text-txt-secondary select-none">{label}</span>}
    </label>
  );
}
