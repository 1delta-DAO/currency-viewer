export default function Input({ value, onChange, placeholder }: any) {
  return (
    <input
      className='w-full rounded-lg border border-[var(--border)] bg-[var(--overlay-4)] px-4 py-2.5 text-sm text-[var(--color)] placeholder-[var(--color-muted)] outline-none transition-all duration-200 hover:border-[var(--border-hover)] focus:border-indigo-500/50 focus:bg-[var(--overlay-6)] focus:ring-1 focus:ring-indigo-500/30'
      value={value}
      onChange={onChange}
      placeholder={placeholder}
    />
  );
}
