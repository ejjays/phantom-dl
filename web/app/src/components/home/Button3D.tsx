type Props = {
  label: string;
  loading?: boolean;
  disabled?: boolean;
  retry?: boolean;
  onClick: () => void;
};

export default function Button3D({
  label,
  loading = false,
  disabled = false,
  retry = false,
  onClick,
}: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group relative mt-4 h-[52px] w-full cursor-pointer rounded-full bg-[#155e75] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span className="absolute inset-0 flex -translate-y-[5px] items-center justify-center overflow-hidden rounded-full bg-[#06b6d4] transition-transform duration-100 group-active:translate-y-0">
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full bg-[#ef4444] transition-opacity duration-300"
          style={{ opacity: retry ? 1 : 0 }}
        />
        {loading ? (
          <span
            aria-label="Processing"
            className="relative h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white"
          />
        ) : (
          <span className="relative font-mono text-lg font-bold tracking-[0.9px] text-white uppercase">
            {label}
          </span>
        )}
      </span>
    </button>
  );
}
