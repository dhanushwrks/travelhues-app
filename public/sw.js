const OFFLINE_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#e12e2f" />
    <title>Travelhues</title>
    <style>
      body {
        margin: 0;
        min-height: 100dvh;
        display: grid;
        place-items: center;
        background: #d5e3e6;
        color: #12232a;
        font-family: "Avenir Next", sans-serif;
      }
      main { text-align: center; padding: 24px; max-width: 22rem; }
      h1 { margin: 0 0 8px; font-size: 1.5rem; }
      p { margin: 0 0 20px; color: #3d4f56; }
      button {
        background: #e12e2f;
        color: white;
        border: 0;
        border-radius: 999px;
        padding: 12px 20px;
        font: inherit;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>You're offline</h1>
      <p>Travelhues needs a connection to load stories and maps.</p>
      <button type="button" onclick="location.reload()">Try again</button>
    </main>
  </body>
</html>`;

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || request.mode !== "navigate") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(request).catch(
      () =>
        new Response(OFFLINE_HTML, {
          headers: { "Content-Type": "text/html; charset=utf-8" },
        }),
    ),
  );
});
