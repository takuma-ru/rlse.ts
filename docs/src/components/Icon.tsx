type IconProps = Record<string, string | number | boolean | undefined>;

const defaultIconProps = {
  width: "1em",
  height: "1em",
  viewBox: "0 0 24 24",
  fill: "currentColor",
  "aria-hidden": "true",
} as const;

export const GithubIcon = (props: IconProps) => (
  <svg {...defaultIconProps} {...props} viewBox="0 0 24 24">
    <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.2.8-.6v-2.2c-3.3.7-4-1.4-4-1.4-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 .1.7 2.1 3.4 1.5.1-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.6.1-3.2 0 0 1-.3 3.3 1.2a11.4 11.4 0 0 1 6 0C17.1 5.6 18 5.9 18 5.9c.6 1.6.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .4.2.7.8.6A12 12 0 0 0 12 .3Z" />
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
