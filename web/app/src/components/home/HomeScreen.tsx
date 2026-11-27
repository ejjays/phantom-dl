import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from 'react';
import { Link as LinkIcon } from 'lucide-react';
import SEO from '../utils/SEO';
import MobileProgress from '../MobileProgress';
import DesktopProgress from '../DesktopProgress';
import StandardQualityPicker from '../modals/StandardQualityPicker';
import MobileSpotifyPicker from '../modals/MobileSpotifyPicker';
import { useMediaConverter } from '../../hooks/useMediaConverter';
import { useVisualViewport } from '../../hooks/useVisualViewport';
import { useAppStore } from '../../store/useAppStore';
import { PlayerData } from '../../types/player';
import {
  BAD_LINK_LINES,
  IDLE_LINES,
  QUIPS,
  RETURNING_PAIRS,
  SUCCESS_LINES,
  WELCOME_MSG,
  looksLikeLink,
  nextIndex,
  pickLine,
} from '../../lib/homeCopy';
import { idleTick } from '../../lib/idle.logic';
import PhantomHero from '../../assets/icons/PhantomHero';
import SpeechBubble from './SpeechBubble';
import FormatBar from './FormatBar';
import Button3D from './Button3D';

const MusicPlayerCard = lazy(() => import('../MusicPlayerCard'));

const QUIP_COOLDOWN_MS = 8000;
const BAD_LINK_COOLDOWN_MS = 8000;
const BAD_LINK_DEBOUNCE_MS = 600;
const GREETING_DELAY_MS = 1200;
const IDLE_CHECK_MS = 1000;
const FLAG_MS = 6000;

type Bubble = {
  id: number;
  message: string;
  followUp?: string;
  quick?: boolean;
};

function A11yAnnouncement({
  loading,
  status,
  error,
}: {
  loading: boolean;
  status: string;
  error: string;
}) {
  const progress = useAppStore((state) => state.progress);
  const subStatus = useAppStore((state) => state.subStatus);
  return (
    <div aria-live="polite" aria-atomic="true" className="sr-only">
      {loading && status && (subStatus ? `${status}: ${subStatus}` : status)}
      {error && `Error: ${error}`}
      {progress > 0 &&
        progress < 100 &&
        `Download progress: ${Math.round(progress)}%`}
    </div>
  );
}

export default function HomeScreen() {
  const url = useAppStore((state) => state.url);
  const setUrl = useAppStore((state) => state.setUrl);
  const loading = useAppStore((state) => state.loading);
  const error = useAppStore((state) => state.error);
  const status = useAppStore((state) => state.status);
  const videoData = useAppStore((state) => state.videoData);
  const isPickerOpen = useAppStore((state) => state.isPickerOpen);
  const setIsPickerOpen = useAppStore((state) => state.setIsPickerOpen);
  const selectedFormat = useAppStore((state) => state.selectedFormat);
  const setSelectedFormat = useAppStore((state) => state.setSelectedFormat);
  const showPlayer = useAppStore((state) => state.showPlayer);
  const setShowPlayer = useAppStore((state) => state.setShowPlayer);
  const playerData = useAppStore(
    (state) => state.playerData
  ) as PlayerData | null;

  const {
    isMobile,
    isSpotifySession,
    handleDownloadTrigger,
    handleDownload,
    cancelDownload,
    requestClipboard,
  } = useMediaConverter();

  useVisualViewport();

  const [bubble, setBubble] = useState<Bubble | null>(null);
  const [focused, setFocused] = useState(false);
  const [gazeTick, setGazeTick] = useState(0);
  const [moonKey, setMoonKey] = useState(0);
  const [flagVisible, setFlagVisible] = useState(false);

  const bubbleId = useRef(0);
  const bubbleRef = useRef<Bubble | null>(null);
  const focusedRef = useRef(false);
  const lastQuipAt = useRef(0);
  const lastBadLinkAt = useRef(0);
  const lastActivity = useRef(Date.now());
  const lastIdleAt = useRef(0);
  const lastIdleStart = useRef(0);

  bubbleRef.current = bubble;
  focusedRef.current = focused;

  const showBubble = useCallback(
    (next: Omit<Bubble, 'id'>) => {
      bubbleId.current += 1;
      setBubble({ id: bubbleId.current, ...next });
    },
    []
  );

  const clearBubble = useCallback(() => setBubble(null), []);

  const bumpActivity = useCallback(() => {
    lastActivity.current = Date.now();
  }, []);

  useEffect(() => {
    const seen = localStorage.getItem('phantom_seen') === '1';
    localStorage.setItem('phantom_seen', '1');
    const timer = window.setTimeout(() => {
      if (seen) {
        const pair =
          RETURNING_PAIRS[nextIndex('phantom_greeting', RETURNING_PAIRS.length)];
        showBubble({ message: pair[0], followUp: pair[1] });
        return;
      }
      showBubble({ message: WELCOME_MSG });
    }, GREETING_DELAY_MS);
    return () => clearTimeout(timer);
  }, [showBubble]);

  useEffect(() => {
    if (!url.trim() || looksLikeLink(url)) return;
    const timer = window.setTimeout(() => {
      const now = Date.now();
      if (now - lastBadLinkAt.current < BAD_LINK_COOLDOWN_MS) return;
      lastBadLinkAt.current = now;
      showBubble({
        message: pickLine(BAD_LINK_LINES, 'phantom_bad_link'),
        quick: true,
      });
    }, BAD_LINK_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [url, showBubble]);

  useEffect(() => {
    const id = window.setInterval(() => {
      const decision = idleTick({
        now: Date.now(),
        lastActivity: lastActivity.current,
        lastIdleAt: lastIdleAt.current,
        lastIdleStart: lastIdleStart.current,
        bubbleUp: Boolean(bubbleRef.current) || focusedRef.current || loading,
      });
      if (decision !== 'fire') return;
      const now = Date.now();
      lastIdleAt.current = now;
      lastIdleStart.current = now;
      showBubble({
        message: pickLine(IDLE_LINES, 'phantom_idle'),
        quick: true,
      });
    }, IDLE_CHECK_MS);
    return () => clearInterval(id);
  }, [loading, showBubble]);

  useEffect(() => {
    if (status !== 'completed') return;
    setFlagVisible(true);
    showBubble({
      message: pickLine(SUCCESS_LINES, 'phantom_success'),
      quick: true,
    });
    const timer = window.setTimeout(() => setFlagVisible(false), FLAG_MS);
    return () => clearTimeout(timer);
  }, [status, showBubble]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA';

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'v') {
        if (typing) return;
        event.preventDefault();
        navigator.clipboard
          .readText()
          .then((text) => {
            setUrl(text);
            bumpActivity();
            document.getElementById('url-input')?.focus();
          })
          .catch(() => {});
        return;
      }

      if (event.key === 'Enter' && !loading && url.trim()) {
        event.preventDefault();
        bumpActivity();
        void handleDownloadTrigger();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [url, loading, setUrl, handleDownloadTrigger, bumpActivity]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shared = params.get('url') || params.get('text') || params.get('title');
    if (!shared) return;
    const match = shared.match(/https?:\/\/[^\s]+/);
    if (!match) return;
    setUrl(match[0]);
    window.history.replaceState({}, document.title, window.location.pathname);
    const timer = window.setTimeout(() => {
      void handleDownloadTrigger(match[0]);
    }, 100);
    return () => clearTimeout(timer);
  }, [handleDownloadTrigger, setUrl]);

  const handleQuip = useCallback(() => {
    bumpActivity();
    const now = Date.now();
    if (now - lastQuipAt.current < QUIP_COOLDOWN_MS) return;
    lastQuipAt.current = now;
    showBubble({ message: pickLine(QUIPS, 'phantom_quip'), quick: true });
  }, [bumpActivity, showBubble]);

  const handleFocus = useCallback(() => {
    setFocused(true);
    setFlagVisible(false);
    bumpActivity();
    if (url.trim()) return;
    setGazeTick((tick) => tick + 1);
    setMoonKey((key) => key + 1);
  }, [bumpActivity, url]);

  const handleBlur = useCallback(() => {
    setFocused(false);
  }, []);

  const handlePaste = useCallback(async () => {
    bumpActivity();
    if (requestClipboard()) return;
    try {
      setUrl(await navigator.clipboard.readText());
    } catch {
      // clipboard denied by the browser
    }
  }, [bumpActivity, requestClipboard, setUrl]);

  const handleSubmit = useCallback(() => {
    bumpActivity();
    if (!url.trim() || loading) return;
    void handleDownloadTrigger();
  }, [bumpActivity, handleDownloadTrigger, loading, url]);

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      bumpActivity();
      setUrl(event.target.value);
    },
    [bumpActivity, setUrl]
  );

  return (
    <>
      <SEO
        title="YouTube, Spotify, TikTok & Instagram Downloader · 4K MP3"
        description="Free downloader & converter for YouTube, Spotify, TikTok, Instagram, Facebook, SoundCloud. 4K video, 320kbps MP3, AI stem separation. No ads, no signup."
        canonicalUrl="/"
        schema={{
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'Phantom',
          operatingSystem: 'All',
          applicationCategory: 'MultimediaApplication',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          description:
            'Free downloader & converter for YouTube, Spotify, TikTok, Instagram, Facebook, and SoundCloud. 4K video, 320kbps MP3, AI stem separation, no signup.',
        }}
      />
      <A11yAnnouncement loading={loading} status={status} error={error} />

      <div
        aria-hidden="true"
        key={moonKey}
        className={moonKey === 0 ? 'moon-orb moon-orb-idle' : 'moon-orb'}
      />

      <div className="my-auto flex w-full max-w-[448px] flex-col items-center md:max-w-[560px]">
        <div
          aria-hidden="true"
          className="h-0 shrink-0 [@media(max-height:620px)]:h-[76px]"
        />
        <div
          className={`relative flex w-full flex-col items-center ${
            focused ? 'mb-0' : 'mb-2'
          }`}
        >
          {bubble ? (
            <SpeechBubble
              key={bubble.id}
              message={bubble.message}
              followUp={bubble.followUp}
              quick={bubble.quick}
              onDone={clearBubble}
            />
          ) : null}
          <div
            data-testid="hero-box"
            style={{
              width: 'min(max(209px, 26.6vw), 42dvh, 400px)',
              transform: 'scale(calc(1 - var(--kb-ratio, 0) * 0.05))',
              transformOrigin: 'bottom center',
            }}
          >
            <PhantomHero
              flagVisible={flagVisible}
              gazeTick={gazeTick}
              onQuip={handleQuip}
            />
          </div>
        </div>

        <div className="relative w-full">
          <label htmlFor="url-input" className="sr-only">
            Media URL (YouTube, Spotify, TikTok, Instagram, Facebook,
            SoundCloud)
          </label>
          <span className="pointer-events-none absolute top-1/2 left-4 z-10 flex h-5 w-5 -translate-y-1/2 items-center justify-center">
            <span className="link-ping absolute inset-0 rounded-full bg-cyan-400" />
            <LinkIcon className="h-5 w-5 text-cyan-400" aria-hidden="true" />
          </span>
          <input
            id="url-input"
            type="url"
            inputMode="url"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder="paste your link here"
            value={url}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            aria-label="Paste media URL from YouTube, Spotify, TikTok, Instagram, Facebook, or SoundCloud"
            className="h-[52px] w-full rounded-2xl border-2 border-[#06b6d4] bg-black/30 pr-4 pl-12 font-mono text-[15px] text-white placeholder:text-[#5b6472] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60"
          />
        </div>

        <FormatBar
          mode={selectedFormat === 'mp3' ? 'mp3' : 'mp4'}
          onChange={setSelectedFormat}
          onPaste={handlePaste}
        />

        <Button3D
          label={error ? 'Retry' : 'Download'}
          loading={loading}
          disabled={loading}
          retry={Boolean(error)}
          onClick={handleSubmit}
        />

        {error ? (
          <p
            role="alert"
            className="mt-3 max-w-full text-center font-mono text-xs leading-5 text-red-400"
          >
            {error}
          </p>
        ) : null}

        <Suspense fallback={null}>
          {isSpotifySession && isMobile ? (
            <MobileSpotifyPicker
              isOpen={isPickerOpen}
              onClose={() => setIsPickerOpen(false)}
              videoData={videoData as Record<string, unknown>}
              onSelect={(qualityId, metadata) =>
                handleDownload(
                  metadata?.extension || 'mp3',
                  qualityId,
                  metadata
                )
              }
            />
          ) : (
            <StandardQualityPicker
              isOpen={isPickerOpen}
              onClose={() => setIsPickerOpen(false)}
              selectedFormat={selectedFormat}
              videoData={videoData as Record<string, unknown>}
              onSelect={(qualityId, metadata) =>
                handleDownload(
                  metadata?.extension || selectedFormat,
                  qualityId,
                  metadata
                )
              }
              onRetry={() => handleDownloadTrigger()}
            />
          )}

          <MusicPlayerCard
            isVisible={showPlayer}
            data={playerData}
            onClose={() => setShowPlayer(false)}
          />
        </Suspense>

        <MobileProgress onCancel={cancelDownload} />
        <DesktopProgress onCancel={cancelDownload} />
      </div>
    </>
  );
}
