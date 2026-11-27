type Props = {
  flagVisible: boolean;
  gazeTick: number;
  onQuip: () => void;
};

const BODY_PATH =
  'M 80 170 C 80 103.7, 133.7 50, 200 50 C 266.3 50, 320 103.7, 320 170 L 320 330 Q 290 352, 260 330 Q 230 352, 200 330 Q 170 352, 140 330 Q 110 352, 80 330 Z';
const FOLD_PATH =
  'M 285 105 C 305 140, 320 220, 320 330 Q 290 352, 260 330 Q 250 322, 245 310 C 270 270, 280 180, 285 105 Z';
const FLAG_BANNER_PATH =
  'M 295 90 C 331 78, 356 102, 392 90 L 392 160 C 356 172, 331 148, 295 160 Z';
const FLAG_CHECK_PATH = 'M46 14L25 35.6l-7-7.2l-7 7.2L25 50l28-28.8z';

export default function PhantomHero({
  flagVisible,
  gazeTick,
  onQuip,
}: Props) {
  const gazeClass =
    gazeTick === 0
      ? ''
      : gazeTick % 2 === 1
        ? 'ghost-gaze-down'
        : 'ghost-gaze-sweep';

  return (
    <button
      type="button"
      onClick={onQuip}
      aria-label="Tap Phantom for a quip"
      className="block w-full cursor-pointer rounded-3xl focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"
      style={{ aspectRatio: '430 / 400' }}
    >
      <svg
        viewBox="0 0 400 430"
        className="h-full w-full overflow-visible"
        aria-hidden="true"
      >
        <defs>
          <linearGradient
            id="ghost-body-grad"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#E0F7FA" />
            <stop offset="60%" stopColor="#67E8F9" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>
          <filter
            id="ghost-shadow"
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
          >
            <feDropShadow
              dx="0"
              dy="8"
              stdDeviation="6"
              floodColor="#06B6D4"
              floodOpacity="0.3"
            />
          </filter>
        </defs>

        <ellipse
          className="ghost-shadow"
          cx="200"
          cy="385"
          rx="75"
          ry="10"
          fill="#083344"
        />

        <g className="ghost-float" filter="url(#ghost-shadow)">
          <path d={BODY_PATH} fill="url(#ghost-body-grad)" />
          <path d={FOLD_PATH} fill="#0891B2" opacity="0.4" />

          <g
            key={gazeTick}
            className={`ghost-gaze ${gazeClass}`}
            style={{ transformOrigin: '200px 180px' }}
          >
            <g className="ghost-eyes" style={{ transformOrigin: '200px 180px' }}>
              <ellipse cx="165" cy="180" rx="13" ry="18" fill="#083344" />
              <ellipse cx="168" cy="175" rx="5" ry="7" fill="#FFFFFF" />
              <ellipse cx="235" cy="180" rx="13" ry="18" fill="#083344" />
              <ellipse cx="238" cy="175" rx="5" ry="7" fill="#FFFFFF" />
            </g>

            <ellipse
              cx="148"
              cy="197"
              rx="9"
              ry="5"
              fill="#0891B2"
              opacity="0.6"
            />
            <ellipse
              cx="252"
              cy="197"
              rx="9"
              ry="5"
              fill="#0891B2"
              opacity="0.6"
            />
            <path
              className="ghost-mouth"
              d="M 187 218 Q 200 225 213 218 Q 200 219 187 218 Z"
              fill="#083344"
            />
          </g>

          <g
            className={`ghost-flag${flagVisible ? ' is-in' : ''}`}
            style={{ transformOrigin: '285px 150px' }}
          >
            <g transform="rotate(10 285 150)" filter="url(#ghost-shadow)">
              <line
                x1="295"
                y1="80"
                x2="295"
                y2="340"
                stroke="#E0F7FA"
                strokeWidth="4.5"
                strokeLinecap="round"
              />
              <circle cx="295" cy="76" r="6" fill="#FBBF24" />
              <g className="ghost-flutter" style={{ transformOrigin: '285px 150px' }}>
                <path d={FLAG_BANNER_PATH} fill="#4BD37B" />
                <path
                  d={FLAG_CHECK_PATH}
                  fill="#FFFFFF"
                  transform="translate(344 125) scale(0.5) translate(-32 -32)"
                />
              </g>
            </g>
          </g>
        </g>
      </svg>
    </button>
  );
}
