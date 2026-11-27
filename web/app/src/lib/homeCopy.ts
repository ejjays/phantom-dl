export const WELCOME_MSG =
  'Hi, welcome I\u2019m Phantom, let\u2019s make some magic..';

export const RETURNING_PAIRS: [string, string][] = [
  ['hey, it\u2019s me again. glad you\u2019re here', 'got a link? let\u2019s grab it'],
  ['hello, good to see you again', 'youtube, spotify, tiktok \u2014 your pick'],
  ['let\u2019s do some magic again?', 'same spell, new link. paste it'],
  [
    'it\u2019s me. who else would haunt a downloader?',
    'now. about that link..',
  ],
  ['you\u2019re back! the media is waiting for us', 'are you ready for the show?'],
  [
    'good timing. i was just polishing my spook',
    'so. where\u2019s the victim link?',
  ],
  [
    'the internet is loud. let\u2019s grab someone.. i mean. something',
    'paste it. let\u2019s make magic',
  ],
];

export const QUIPS = [
  'boo! ...just kidding, it\u2019s me',
  'got a link? i\u2019m hungry',
  'i dream in mp3 shuffles',
  'youtube? spotify? surprise me',
  'i\u2019d cross the internet for you',
  'boop. i felt that',
  'no link? we can still vibe',
  'i\u2019ve seen so many urls. yours are my favorite',
  'my magic is free \u2014 links aren\u2019t',
  'you returned! i was about to haunt this screen solo',
  'rawr,.. i mean.. boo',
  'you can see me but i can\u2019t see you.. are you a ghost too?',
];

export const IDLE_LINES = [
  'no rush. the magic can wait',
  'just chilling... whenever you\u2019re ready',
  'staring at me? should i strike a pose?',
  'waiting mode: activated',
  'sometimes i haunt, mostly i download',
  'do ghosts get lonely? ...yes',
  'i almost counted all the pixels in your screen',
  'I\u2019ll just be here, floating',
  'i once downloaded a video twice. it was that good',
  'silence is my favorite playlist',
  'i\u2019ve memorized every icon on this screen',
  'stare all you want. i\u2019m used to being watched (ghost problems)',
];

export const BAD_LINK_LINES = [
  'hmm, that doesn\u2019t look like a link to me..',
  'that\u2019s not a link.. try pasting one?',
  'did you mean to paste something else?',
  'i can\u2019t read that. is it a url?',
  'oops \u2014 that\u2019s not a valid link',
  'i need a link, not just words. try again?',
  'that link looks broken to me..',
  'no magic can happen without a real link',
];

export const SUCCESS_LINES = [
  'got it! saved to your device. i did a little ghost dance',
  'caught it! it\u2019s all yours now',
  'done! the magic worked.. again',
  'saved! that one\u2019s worth keeping',
  'download complete. my spook level: expert',
  'it\u2019s yours now. handle with care',
  'saved safely. my ghost duties: complete',
];

export function looksLikeLink(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  const host = trimmed
    .replace(/^https?:\/\//iu, '')
    .split(/[/?#]/u)[0]
    .toLowerCase();
  return host.includes('.');
}

export function nextIndex(key: string, length: number): number {
  const raw = Number.parseInt(localStorage.getItem(key) ?? '0', 10);
  const index = Number.isFinite(raw) ? Math.abs(raw) % length : 0;
  localStorage.setItem(key, String((index + 1) % length));
  return index;
}

export function pickLine(lines: string[], key: string): string {
  return lines[nextIndex(key, lines.length)];
}
