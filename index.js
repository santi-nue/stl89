// index.js - A simple example of a JavaScript file for Deno Deploy

Deno.serve((req) => {
  return new Response("Hello from Deno Deploy with JavaScript!", {
    status: 200,
  });
});
