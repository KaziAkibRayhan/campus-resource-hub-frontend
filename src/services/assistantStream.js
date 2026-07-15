// SSE client for the AI assistant's streaming endpoint. Uses fetch instead of
// EventSource because the endpoint is a POST and needs the Bearer header.
// Throws on a non-OK response so callers can fall back to the non-streaming
// POST /chat/assistant.
import { API_BASE_URL } from "./api";

export async function streamAssistant({
  question,
  history = [],
  signal,
  onSources,
  onToken,
  onDone,
}) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE_URL}/chat/assistant/stream`, {
    method: "POST",
    signal,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ question, history }),
  });

  if (!res.ok || !res.body) {
    throw new Error("stream-unavailable");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let finished = false;

  const handleFrame = (frame) => {
    const event = /^event: (.+)$/m.exec(frame)?.[1];
    const rawData = /^data: (.+)$/m.exec(frame)?.[1];
    if (!event || !rawData) return;
    let data;
    try {
      data = JSON.parse(rawData);
    } catch {
      return;
    }
    if (event === "sources") onSources?.(data.sources || [], data);
    else if (event === "token") onToken?.(data.t || "");
    else if (event === "done") {
      finished = true;
      onDone?.(data);
    } else if (event === "error") {
      throw new Error(data.message || "stream-error");
    }
  };

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx;
    while ((idx = buffer.indexOf("\n\n")) !== -1) {
      const frame = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      handleFrame(frame);
    }
  }

  if (!finished) {
    throw new Error("stream-incomplete");
  }
}
