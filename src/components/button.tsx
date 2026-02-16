export default function Button({ children, onClick, disabled, variant = 'primary' }: any) {
  const base =
    'inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-40';

  const variants: Record<string, string> = {
    primary:
      'bg-indigo-500 text-white hover:bg-indigo-400 active:bg-indigo-600 shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30',
    ghost:
      'border border-[var(--border)] bg-[var(--overlay-4)] text-[var(--color)] hover:border-[var(--border-hover)] hover:bg-[var(--overlay-8)]'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant] || variants.primary}`}
    >
      {children}
    </button>
  );
}
