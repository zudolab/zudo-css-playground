const JSON_HEADERS = { "Content-Type": "application/json" };

export function jsonResponse(
  data: Record<string, unknown>,
  status = 200,
): Response {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}
