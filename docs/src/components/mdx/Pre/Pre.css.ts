import { css } from "hono/css";

export const preContainer = css`
  position: relative;
  overflow: auto;
  margin: 1rem 0;
  background-color: var(--background-secondary);
  border-radius: 0.5em;
`;

export const metaContainer = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0.5rem 1rem 0;
`;

export const fileNameText = css`
  color: var(--text-secondary);
  font-weight: 700;
  font-size: 0.8rem;
`;

export const langText = css`
  display: flex;
  gap: 0.25rem;
  align-items: center;
  color: var(--text-secondary);
  font-size: 0.8rem;
`;

export const promptText = css`
  user-select: none;
  margin-right: 0.75rem;
`;

export const copyButton = css`
  position: absolute;
  top: calc(0.75rem + 0.5rem + 0.75rem);
  right: 0.5rem;
  padding: 0.25em;
  cursor: pointer;
  width: 2rem;
  height: 2rem;
  aspect-ratio: 1/1;
  background: transparent;
  border: none;
  opacity: 0.5;
  transition: all 0.2s ease-in-out;
  user-select: none;

  &:active {
    transform: scale(0.8);
  }

  &:hover {
    opacity: 1;
  }
`;

export const pre = css`
  position: relative;
  overflow: auto;
  padding: 1rem;
  margin: 0;
  border: 1px solid;
  border-color: transparent;
  border-radius: 0 0 0.5em 0.5em;
`;
