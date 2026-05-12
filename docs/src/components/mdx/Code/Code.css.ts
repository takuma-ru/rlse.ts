import { css } from "hono/css";

export const inlineCode = css`
  background-color: var(--background-secondary);
  color: var(--text-highlight);
  padding: 0.1em 0.3em;
  border-radius: 0.25em;
  font-size: 0.9em;
  font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas,
    Liberation Mono, monospace;
`;
