import React from 'react';
import TwinkleStars from './ui/TwinkleStars';
import ShootingStars from './ui/ShootingStars';
import ErudaLoader from './utils/ErudaLoader';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => (
  <div className="relative flex min-h-[var(--app-h,100dvh)] w-full flex-col overflow-x-hidden">
    <ErudaLoader />
    <TwinkleStars />
    <ShootingStars />

    <main
      id="main-content"
      className="relative z-10 flex grow flex-col items-center px-6 pt-6 pb-16"
    >
      {children}
    </main>

    <div className="sr-only">
      <h2>
        Free Video and Audio Downloader for YouTube, Spotify, TikTok, Instagram
        and More
      </h2>
      <p>
        Phantom is a free, ad-free online tool to download high-quality video
        and audio from YouTube, Spotify, TikTok, Instagram, Facebook, and
        SoundCloud. Convert YouTube videos to 4K MP4 or 320kbps MP3, download
        Spotify playlists, and save TikTok videos without watermark — all in
        your browser, with no registration required.
      </p>
    </div>
  </div>
);

export default Layout;
