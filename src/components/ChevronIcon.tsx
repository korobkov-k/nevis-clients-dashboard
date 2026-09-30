interface ChevronIconProps {
  expanded: boolean;
}

/** 16 px disclosure chevron from the design: points right when collapsed, down when expanded. */
export function ChevronIcon({ expanded }: ChevronIconProps) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={`block transition-transform duration-150 motion-reduce:transition-none ${expanded ? '' : '-rotate-90'}`}
    >
      <path
        d="M11.5 6.5L8 10L4.5 6.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="square"
      />
    </svg>
  );
}
