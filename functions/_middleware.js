const unauthorized = () => new Response("Authentication required", {
  status: 401,
  headers: {
    "WWW-Authenticate": 'Basic realm="Eric Asset Dashboard", charset="UTF-8"',
    "Cache-Control": "no-store",
  },
});

const setupRequired = () => new Response("Dashboard password is not configured.", {
  status: 500,
  headers: {
    "Cache-Control": "no-store",
  },
});

const parseBasicAuth = request => {
  const header = request.headers.get("Authorization") || "";
  const match = header.match(/^Basic\s+(.+)$/i);
  if (!match) return null;

  try {
    const decoded = atob(match[1]);
    const separator = decoded.indexOf(":");
    if (separator < 0) return null;
    return {
      username: decoded.slice(0, separator),
      password: decoded.slice(separator + 1),
    };
  } catch {
    return null;
  }
};

export const onRequest = async context => {
  const expectedUsername = context.env.DASHBOARD_USERNAME;
  const expectedPassword = context.env.DASHBOARD_PASSWORD;

  if (!expectedUsername || !expectedPassword) {
    return setupRequired();
  }

  const credentials = parseBasicAuth(context.request);
  if (
    !credentials ||
    credentials.username !== expectedUsername ||
    credentials.password !== expectedPassword
  ) {
    return unauthorized();
  }

  const response = await context.next();
  response.headers.set("Cache-Control", "no-store");
  return response;
};
