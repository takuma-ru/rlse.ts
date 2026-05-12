import { css } from "hono/css";

export const header = css`
  position: fixed;
  z-index: 999;
  width: 100%;
  height: 64px;
  top: 0;
  left: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: color-mix(
    in srgb,
    var(--background-primary) 80%,
    transparent
  );
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  border-bottom: 1px solid var(--background-secondary);
`;

export const titleAnchor = css`
  text-decoration: none;
`;

export const titleText = css`
  color: var(--text-primary);
  font-weight: 700;
  margin: 0;
`;

export const links = css`
  display: flex;
  align-items: center;
  gap: 1rem;
`;
