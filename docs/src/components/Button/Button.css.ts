import { css } from "hono/css";

export const base = css`
  color: var(--text-primary);
  background-color: var(--background-secondary);
  padding: 0.5em 1.5em;
  border-radius: 0.5em;
  text-align: center;
  transition: transform 0.1s ease-in-out;
  line-height: 1.5;
  cursor: pointer;

  &:active {
    transform: scale(0.95);
  }
`;

export const anchor = css`
  ${base}
  display: inline-block;
`;

export const button = css`
  ${base}
  border: none;
`;
