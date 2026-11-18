const paths = [
  <>
    <path d="M6 12.5h25a2.5 2.5 0 0 1 2.5 2.5v16a2.5 2.5 0 0 1-2.5 2.5H8.5A2.5 2.5 0 0 1 6 31V12.5Zm0 0A3 3 0 0 1 9 9h19v3.5" />
    <path d="M33.5 19H26a3.2 3.2 0 0 0 0 6.5h7.5" />
  </>,
  <>
    <rect x="5.5" y="9.5" width="29" height="21" rx="2" />
    <path d="m6.5 11 13.5 11 13.5-11" />
  </>,
  <>
    <circle cx="17" cy="13" r="6.5" />
    <path d="M5 33c.8-7 6-11 12-11 1.8 0 3.6.4 5.2 1.1" />
    <circle cx="29" cy="28" r="3" />
    <path d="M29 21.5V24m0 8v2.5m6.5-6.5H33m-8 0h-2.5m11.1-4.6-1.8 1.8m-5.6 5.6-1.8 1.8m9.2 0-1.8-1.8m-5.6-5.6-1.8-1.8" />
  </>,
  <>
    <path d="M20 5.5 7 10v10c0 7.5 5.5 12.5 13 15 7.5-2.5 13-7.5 13-15V10L20 5.5Z" />
    <circle cx="20" cy="17" r="3" />
    <path d="M20 20v7m0-3h3" />
  </>,
  <>
    <rect x="4.5" y="9.5" width="31" height="23" rx="2" />
    <path d="m9 26 6-6 5 3.5L30 15" />
  </>,
  <>
    <circle cx="20" cy="20" r="14.5" />
    <path d="M20 10v10l7 4M20 7.5V9m0 22v1.5M7.5 20H9m22 0h1.5" />
  </>,
];
export function AccountIcon({ index }: { index: number }) {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      stroke="#8d9496"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[index]}
    </svg>
  );
}
