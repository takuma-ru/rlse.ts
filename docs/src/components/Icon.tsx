type IconProps = Record<string, string | number | boolean | undefined>;

const defaultIconProps = {
  width: "1.5em",
  height: "1.5em",
  viewBox: "0 0 24 24",
  fill: "currentColor",
  "aria-hidden": "true",
} as const;

export const GithubIcon = (props: IconProps) => (
  <svg {...defaultIconProps} {...props} viewBox="0 0 24 24">
    <path
      fill="currentColor"
      d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34c-.46-1.16-1.11-1.47-1.11-1.47c-.91-.62.07-.6.07-.6c1 .07 1.53 1.03 1.53 1.03c.87 1.52 2.34 1.07 2.91.83c.09-.65.35-1.09.63-1.34c-2.22-.25-4.55-1.11-4.55-4.92c0-1.11.38-2 1.03-2.71c-.1-.25-.45-1.29.1-2.64c0 0 .84-.27 2.75 1.02c.79-.22 1.65-.33 2.5-.33s1.71.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02c.55 1.35.2 2.39.1 2.64c.65.71 1.03 1.6 1.03 2.71c0 3.82-2.34 4.66-4.57 4.91c.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2"
    />
  </svg>
);

export const NpmIcon = (props: IconProps) => (
  <svg {...defaultIconProps} {...props} viewBox="0 0 24 24">
    <path d="M1.8 7.2h20.4v6.9H12v1.7H7.5v-1.7H1.8V7.2Zm1.7 5.2h1.7V8.9h1.7v3.5h1.7V8.9h1.7v3.5h10.2V8.9H3.5v3.5Zm8.5 0h1.7V8.9H12v3.5Zm3.4 0h1.7V8.9h-1.7v3.5Z" />
  </svg>
);

export const OpenInNewIcon = (props: IconProps) => (
  <svg {...defaultIconProps} {...props} viewBox="0 0 24 24">
    <path d="M14 3h7v7h-2V6.4l-9.3 9.3-1.4-1.4L17.6 5H14V3ZM5 5h6v2H7v10h10v-4h2v6H5V5Z" />
  </svg>
);

export const CommandLineIcon = (props: IconProps) => (
  <svg {...defaultIconProps} {...props} viewBox="0 0 24 24">
    <path d="M4.7 7.3 10.4 13l-5.7 5.7-1.4-1.4L7.6 13 3.3 8.7l1.4-1.4ZM11 17h10v2H11v-2Z" />
  </svg>
);

export const CodeJsonIcon = (props: IconProps) => (
  <svg {...defaultIconProps} {...props} viewBox="0 0 24 24">
    <path d="M5 3h3v2H6v14h2v2H5c-.6 0-1-.4-1-1V4c0-.6.4-1 1-1Zm11 0h3c.6 0 1 .4 1 1v16c0 .6-.4 1-1 1h-3v-2h2V5h-2V3Zm-4.2 14.4 1.6-10 2 .3-1.6 10-2-.3ZM9 9h2v2H9V9Zm0 4h2v2H9v-2Z" />
  </svg>
);

export const TypescriptIcon = (props: IconProps) => (
  <svg {...defaultIconProps} {...props} viewBox="0 0 24 24">
    <path d="M3 3h18v18H3V3Zm10 7.1H8.2v1.6h1.6V17h1.8v-5.3H13v-1.6Zm.6 6.3c.6.5 1.5.8 2.5.8 1.8 0 2.9-.9 2.9-2.3 0-1.3-.7-1.9-2.4-2.5-.9-.3-1.2-.5-1.2-.9 0-.4.3-.6.9-.6.6 0 1.2.2 1.8.6l.8-1.4c-.7-.5-1.5-.8-2.5-.8-1.7 0-2.8 1-2.8 2.3 0 1.4.8 2 2.4 2.5.8.3 1.1.5 1.1.9 0 .4-.4.7-1 .7-.7 0-1.3-.2-1.9-.7l-.6 1.4Z" />
  </svg>
);
