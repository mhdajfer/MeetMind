import WebSocket from "ws";
import { EventEmitter } from "events";
import { DEEPGRAM_API_KEY } from "../../../shared/config/environment";
import { logger } from "../../../shared/utils/logger";

export interface DeepgramSession {
  id: string;
  wsUrl: string;
  ws?: WebSocket;
  emitter: EventEmitter;
}

export async function initDeepgramSession(): Promise<DeepgramSession> {
  if (!DEEPGRAM_API_KEY) {
    throw new Error("DEEPGRAM_API_KEY is not configured");
  }

  logger.debug("Creating a new Deepgram session");

  const sessionId = `session_${Date.now()}_${Math.random()
    .toString(36)
    .substr(2, 9)}`;

  const session: DeepgramSession = {
    id: sessionId,
    wsUrl: process.env.DEEPGRAM_WS_URL || "",
    emitter: new EventEmitter(),
  };

  logger.info({ sessionId: session.id }, "Initialized Deepgram session");
  return session;
}

export function connectToDeepgram(session: DeepgramSession): WebSocket {
  const ws = new WebSocket(session.wsUrl, {
    headers: {
      Authorization: `Token ${DEEPGRAM_API_KEY}`,
    },
  });

  ws.on("open", function open() {
    logger.info(
      { sessionId: session.id },
      "Deepgram WebSocket connection established"
    );
    session.emitter.emit("connected");
  });

  ws.on("message", function incoming(data) {
    try {
      const response = JSON.parse(data.toString());

      if (
        response.type === "Results" &&
        response.channel &&
        response.channel.alternatives
      ) {
        const transcript = response.channel.alternatives[0]?.transcript || "";
        const isFinal = response.is_final || false;

        if (transcript) {
          logger.debug(
            { sessionId: session.id, transcript, isFinal },
            "Received transcription from Deepgram"
          );

          session.emitter.emit("message", {
            transcript,
            is_final: isFinal,
            confidence: response.channel.alternatives[0]?.confidence || 0,
            type: isFinal ? "final_transcript" : "partial_transcript",
          });
        }
      } else if (response.type === "Metadata") {
        logger.debug({ sessionId: session.id }, "Deepgram metadata received");
      }
    } catch (error) {
      logger.error(
        { error, sessionId: session.id },
        "Error parsing Deepgram message"
      );
      session.emitter.emit("error", error);
    }
  });

  ws.on("close", function close(code, reason) {
    logger.info(
      { sessionId: session.id, code, reason: reason?.toString() },
      "Deepgram WebSocket connection closed"
    );
    session.emitter.emit("closed");
  });

  ws.on("error", function error(err) {
    logger.error(
      { error: err.message, sessionId: session.id },
      "Deepgram WebSocket error"
    );
    session.emitter.emit("error", err);
  });

  session.ws = ws;
  return ws;
}

export function sendAudioToDeepgram(
  session: DeepgramSession,
  chunk: Buffer
): boolean {
  if (!session.ws || session.ws.readyState !== WebSocket.OPEN) {
    return false;
  }
  session.ws.send(chunk);
  return true;
}

export function closeDeepgramSession(session: DeepgramSession): void {
  if (session.ws) {
    if (session.ws.readyState === WebSocket.OPEN) {
      session.ws.send(JSON.stringify({ type: "CloseStream" }));
    }
    session.ws.close();
  }
  session.emitter.removeAllListeners();
  logger.info({ sessionId: session.id }, "Deepgram session closed");
}
