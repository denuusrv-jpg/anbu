export function HeartIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 20s-7-4.35-9.5-8.5C.87 8.2 2.2 5 5.5 5c1.9 0 3.4 1 4.5 2.5C11.1 6 12.6 5 14.5 5c3.3 0 4.63 3.2 3 6.5C19 15.65 12 20 12 20z" />
    </svg>
  );
}

export function UsersIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="8.5" cy="8" r="3" />
      <circle cx="16" cy="9.5" r="2.5" />
      <path d="M2.5 19c.6-3.2 3-5 6-5s5.4 1.8 6 5" />
      <path d="M14.5 19c.4-2.2 1.7-3.6 3-4.3.9-.5 2.7-.5 4 1.3" />
    </svg>
  );
}

export function ArrowRightIcon({
  className = "w-4 h-4",
}: {
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  );
}
