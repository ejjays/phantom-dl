interface ProgressRingProps {
  pct: number;
  done: boolean;
  hasError: boolean;
  emePhase: boolean;
}

export const ProgressRing = ({
  pct,
  done,
  hasError,
  emePhase,
}: ProgressRingProps) => (
  <svg
    viewBox="0 0 38 38"
    className="absolute inset-[3px] h-[38px] w-[38px] -rotate-90"
    aria-hidden="true"
  >
    <circle
      cx="19"
      cy="19"
      r="16"
      fill="none"
      stroke="rgba(34,211,238,0.16)"
      strokeWidth="3"
    />
    {!done && !hasError && (
      <circle
        cx="19"
        cy="19"
        r="16"
        fill="none"
        stroke={emePhase ? '#c084fc' : '#22d3ee'}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={`${pct}, 100`}
        className="transition-all duration-300"
      />
    )}
  </svg>
);
