import { Hono } from "hono";
import App from "./App";

const app = new Hono();

app.get("/", (c) => {
  return c.html(
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>@takuma-ru/rlse</title>
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
