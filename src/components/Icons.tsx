import type { SVGProps } from 'react';

export type IconName =
  | 'today'
  | 'courses'
  | 'practice'
  | 'trainer'
  | 'settings'
  | 'flame'
  | 'play'
  | 'pause'
  | 'check'
  | 'arrow'
  | 'chevron'
  | 'piano'
  | 'guitar'
  | 'music'
  | 'clock'
  | 'spark'
  | 'refresh'
  | 'sound'
  | 'close'
  | 'target'
  | 'headphones'
  | 'metronome'
  | 'tuner'
  | 'tools'
  | 'book'
  | 'trophy'
  | 'cloud'
  | 'user'
  | 'download'
  | 'globe';

const paths: Record<IconName, React.ReactNode> = {
  today: (
    <>
      <path d="M4 9.5 12 3l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1V9.5Z" />
    </>
  ),
  courses: (
    <>
      <path d="M4 4.5h6a3 3 0 0 1 3 3V21a2.5 2.5 0 0 0-2.5-2.5H4V4.5Z" />
      <path d="M20 4.5h-6a3 3 0 0 0-3 3V21a2.5 2.5 0 0 1 2.5-2.5H20V4.5Z" />
    </>
  ),
  practice: (
    <>
      <path d="M12 3v3M12 18v3M4.2 7.5l2.6 1.5M17.2 15l2.6 1.5M4.2 16.5l2.6-1.5M17.2 9l2.6-1.5" />
      <circle cx="12" cy="12" r="4.2" />
    </>
  ),
  trainer: (
    <>
      <path d="M3 12h2M19 12h2M12 3v2M12 19v2" />
      <circle cx="12" cy="12" r="6.5" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
    </>
  ),
  settings: (
    <>
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  flame: (
    <path d="M12 3s1.5 3.2-1 5.5c-1.4-1.8-2-3.1-2-3.1S5 8.5 5 13a7 7 0 0 0 14 0c0-5.5-5-8.4-7-10Zm0 16a3.6 3.6 0 0 1-3.6-3.6c0-2 1.4-3.3 2.4-4.4.7.9 1.6 1.7 1.6 1.7s2.2-1.6 2.4-3.1c1.3 1.2 2.8 3 2.8 5.6A3.6 3.6 0 0 1 12 19Z" />
  ),
  play: <path d="M8 5.5v13l10-6.5-10-6.5Z" />,
  pause: (
    <>
      <path d="M8 5.5v13M16 5.5v13" />
    </>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7" />,
  arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
  chevron: <path d="m9 6 6 6-6 6" />,
  piano: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="1.8" />
      <path d="M7.5 5v9M12 5v9M16.5 5v9M3 14h18" />
      <path d="M6 5v6M10 5v6M14 5v6M18 5v6" opacity=".55" />
    </>
  ),
  guitar: (
    <>
      <path d="M14.5 4.5 19 9l-2 2-1.5-1.5" />
      <path d="M16.8 8.2 10.5 14.5" />
      <path d="M9.6 12.4c2 0 3.6 1.8 3.6 4a4.2 4.2 0 1 1-8.4 0c0-1.6.8-2.6.8-4 0-1.2-.6-2 .4-3 1-1 2.2-.4 3.6 0Z" />
      <circle cx="7" cy="17" r="1.6" />
      <path d="M19 9.5 21 11" />
    </>
  ),
  music: (
    <>
      <path d="M9 18V5l11-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="17" cy="16" r="3" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v5l3.5 2" />
    </>
  ),
  spark: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" />,
  refresh: (
    <>
      <path d="M20 8a8 8 0 1 0 1 6" />
      <path d="M20 3v5h-5" />
    </>
  ),
  sound: (
    <>
      <path d="M4 9.5h3.5L12 5.5v13L7.5 14.5H4v-5Z" />
      <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6 6 18" />,
  target: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  headphones: (
    <>
      <path d="M4 14v-2a8 8 0 0 1 16 0v2" />
      <rect x="3" y="13" width="4" height="7" rx="1.6" />
      <rect x="17" y="13" width="4" height="7" rx="1.6" />
    </>
  ),
  metronome: (
    <>
      <path d="M9 4h6l4 17H5L9 4Z" />
      <path d="M8 14h8M12 8l5-3" />
    </>
  ),
  tuner: (
    <>
      <path d="M8 3v7a4 4 0 0 0 8 0V3" />
      <path d="M8 3h2M14 3h2M12 14v7M9 21h6" />
    </>
  ),
  tools: (
    <>
      <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
      <circle cx="15" cy="7" r="2.2" />
      <circle cx="9" cy="17" r="2.2" />
    </>
  ),
  book: (
    <>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z" />
      <path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H20" />
    </>
  ),
  cloud: (
    <path d="M7 18.5a4.5 4.5 0 0 1-.6-8.96 5.5 5.5 0 0 1 10.5-1.7A4.25 4.25 0 0 1 17.5 18.5H7Z" />
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </>
  ),
  download: (
    <>
      <path d="M12 3v11m0 0 4-4m-4 4-4-4" />
      <path d="M4.5 17.5v1A2.5 2.5 0 0 0 7 21h10a2.5 2.5 0 0 0 2.5-2.5v-1" />
    </>
  ),
  trophy: (
    <>
      <path d="M8 4h8v6a4 4 0 0 1-8 0V4Z" />
      <path d="M8 6H5v1a3 3 0 0 0 3 3M16 6h3v1a3 3 0 0 1-3 3M12 14v4M9 21h6M10 18h4" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3.5 9h17M3.5 15h17" />
      <path d="M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z" />
    </>
  ),
};

export default function Icon({
  name,
  size = 22,
  ...props
}: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths[name]}
    </svg>
  );
}
