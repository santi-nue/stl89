
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

//import { serve } from "https://deno.land/std/http/server.ts";
//import { encoder } from "https://deno.land/std/encoding/utf8.ts";
const encoder = new TextEncoder();

const readBody = async (req) => {
  const { contentLength } = req;
  const buffer = new Uint8Array(contentLength);
  let bufferSlice = buffer;
  let total = 0;
  while (true) {
    const size = await req.body.read(bufferSlice);
    if (!size) break;
    total += size;
    if (total >= contentLength) break;
    bufferSlice = bufferSlice.subarray(read);
  }
  return buffer;
};

const mitm = async (req) => {
  const { url, method, headers } = req;
  if (!url.startsWith("http://")) {
    return req.respond({ status: 400, body: "invalid" });
  }
  headers.delete("proxy-connection");

  try {
    const res = await fetch(
      url,
      { method, headers, body: await readBody(req) },
    );
    await req.respond(res).catch(() => null);
  } catch (e) {
    await req.respond({ status: 502 });
  }
};

const tunnel = async (req) => {
  const url = new URL(`https://${req.url}`);
  const { hostname, port } = url;
  await req.w.write(
    encoder.encode(`${req.proto} 200 Connection established\r\n\r\n`),
  );
  await req.w.flush();

  let conn = null;
  try {
    conn = await Deno.connect(
      { hostname, port: parseInt(port || 443), transport: "tcp" },
    );
  } catch (e) {
    await req.finalize();
  }
  if (conn) {
    Deno.copy(req.conn, conn).catch(() => null);
    Deno.copy(conn, req.conn).catch(() => null);
  }
};    

 /*
serve((req) => {
  // Conditional logic based on the HTTP method
  return (req.method === "CONNECT" ? tunnel : mitm)(req);
}, { port: 8000   });
*/

/*
Deno.serve((req) => {
  return new Response("Hello from Deno Deploy with JavaScript!", {
    status: 200,
  });
});
*/


// Function for handling MITM (Man-in-the-Middle) requests
/*
async function mitm(req) {
  // Handle MITM logic (e.g., proxying the request, inspecting/modifying data)
  return new Response("MITM proxy request...", { status: 200 });
}
*/
// Main server
Deno.serve(async (req) => {
  // Conditionally handle CONNECT and other requests
  if (req.method === "CONNECT") {
    return tunnel(req); // Handle CONNECT with tunnel
  } else {
    return mitm(req); // Handle other methods with MITM proxy logic
  }
});

