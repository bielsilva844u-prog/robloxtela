import { createReadStream, existsSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";

const root = process.cwd();
const port = 5500;

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
};

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

async function robloxUser(username) {
  const userResponse = await fetch("https://users.roblox.com/v1/usernames/users", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ usernames: [username], excludeBannedUsers: true }),
  });

  if (!userResponse.ok) {
    throw new Error(`Roblox users API retornou ${userResponse.status}`);
  }

  const userPayload = await userResponse.json();
  const user = userPayload.data?.[0];

  if (!user) {
    return null;
  }

  const avatarUrl = new URL("https://thumbnails.roblox.com/v1/users/avatar-headshot");
  avatarUrl.searchParams.set("userIds", String(user.id));
  avatarUrl.searchParams.set("size", "150x150");
  avatarUrl.searchParams.set("format", "Png");
  avatarUrl.searchParams.set("isCircular", "true");

  const avatarResponse = await fetch(avatarUrl);
  const avatarPayload = avatarResponse.ok ? await avatarResponse.json() : {};

  return {
    id: user.id,
    name: user.name,
    displayName: user.displayName,
    avatarUrl: avatarPayload.data?.[0]?.imageUrl ?? "",
  };
}

createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", "http://127.0.0.1");

  if (url.pathname === "/api/roblox-user") {
    const username = url.searchParams.get("username")?.trim();

    if (!username || username.length < 3) {
      sendJson(response, 400, { error: "Digite pelo menos 3 caracteres." });
      return;
    }

    try {
      const user = await robloxUser(username);

      if (!user) {
        sendJson(response, 404, { error: "Usuário não encontrado." });
        return;
      }

      sendJson(response, 200, user);
    } catch (error) {
      sendJson(response, 502, { error: "Não foi possível consultar a API pública do Roblox agora." });
    }
    return;
  }

  const cleanPath = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, "");
  const filePath = join(root, cleanPath === "\\" || cleanPath === "/" ? "index.html" : cleanPath);

  if (!filePath.startsWith(root) || !existsSync(filePath)) {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  response.writeHead(200, {
    "content-type": types[extname(filePath)] ?? "application/octet-stream",
  });
  createReadStream(filePath).pipe(response);
}).listen(port, "127.0.0.1", () => {
  console.log(`http://127.0.0.1:${port}`);
});
