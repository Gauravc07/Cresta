export const WhatsAppIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M17.5 14.4c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.65.08-.3-.15-1.26-.47-2.4-1.48-.89-.8-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.14-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.38-.03-.53-.07-.15-.67-1.62-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.87 1.22 3.07c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.7.62.71.23 1.36.2 1.87.12.57-.09 1.77-.72 2.02-1.43.25-.7.25-1.3.17-1.43-.07-.13-.27-.2-.57-.35zM12 21.97c-1.82 0-3.59-.48-5.14-1.4l-.37-.21-3.82 1 1.02-3.72-.24-.38A9.9 9.9 0 0 1 2 12C2 6.48 6.48 2 12 2s10 4.48 10 10-4.48 9.97-10 9.97zM20.52 3.45A11.9 11.9 0 0 0 12 0C5.39 0 0 5.39 0 12c0 2.12.55 4.2 1.6 6.02L0 24l6.12-1.6A12 12 0 0 0 12 24c6.61 0 12-5.39 12-12 0-3.2-1.25-6.21-3.48-8.55z" />
  </svg>
);

export const ChevronIcon = (props) => (
  <svg viewBox="0 0 10 10" aria-hidden="true" {...props}><path d="M1 3l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" /></svg>
);

export const CloseIcon = (props) => (
  <svg viewBox="0 0 18 18" aria-hidden="true" {...props}><path d="M2 2l14 14M16 2L2 16" stroke="currentColor" strokeWidth="1.6" /></svg>
);

export const DownloadIcon = (props) => (
  <svg viewBox="0 0 18 18" aria-hidden="true" {...props}><path d="M9 2v11M4 8l5 5 5-5M3 16h12" fill="none" stroke="currentColor" strokeWidth="1.6" /></svg>
);

export const ArrowIcon = (props) => (
  <svg viewBox="0 0 18 18" aria-hidden="true" {...props}><path d="M2 9h13M10 4l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.6" /></svg>
);

export const SearchIcon = (props) => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" {...props}><circle cx="7" cy="7" r="5" /><path d="M11 11l3.5 3.5" /></svg>
);

const line = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, 'aria-hidden': true };
export const PhoneIcon = () => <svg viewBox="0 0 24 24" {...line}><path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2z" /></svg>;
export const MailIcon = () => <svg viewBox="0 0 24 24" {...line}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg>;
export const PinIcon = () => <svg viewBox="0 0 24 24" {...line}><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>;
export const FactoryIcon = () => <svg viewBox="0 0 24 24" {...line}><path d="M3 21V10l5 3V10l5 3V6l8 4v11z" /><path d="M3 21h18" /></svg>;
export const ClockIcon = () => <svg viewBox="0 0 24 24" {...line}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
