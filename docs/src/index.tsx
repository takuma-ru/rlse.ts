import { Hono } from "hono";
import { Style } from "hono/css";
import App from "./App";

const app = new Hono();

app.get("/", (c) => {
  return c.html(
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>release.ts</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Intel+One+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <Style />
        {import.meta.env.PROD ? (
          <link rel="stylesheet" href="/static/style.css" />
        ) : (
          <script type="module" src="/src/style-entry.ts" />
        )}
      </head>
      <body>
        <App />
      </body>
    </html>,
  );
});

export default app;
