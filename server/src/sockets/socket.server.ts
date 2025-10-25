import { Server as HttpServer } from "http";
import { Server as IOServer, Socket } from "socket.io";
import {
  initDeepGramSession,
  connectToDeepGram,
  sendAudioToDeepGram,
  closeDeepGramSession,
  DeepGramSession,
} from "../services/gladia.service";
import { logger } from "../utils/logger";
import WebSocket from "ws";

export function initSocketServer(server: HttpServer) {
  const io = new IOServer(server, {
    cors: {
      origin: "*", // tighten in production to allowed origins
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket: Socket) => {
    logger.info({ sid: socket.id }, "Client connected");

    // Each client will have one DeepGram session mapping
    let deepgramSession: DeepGramSession | null = null;

    socket.on("start", async (meta: any = {}) => {
      try {
        deepgramSession = await initDeepGramSession();
        connectToDeepGram(deepgramSession);

        // Notify client when DeepGram WS is ready
        deepgramSession.emitter.on("connected", () => {
          logger.info("DeepGram WS connected, ready to receive audio");
          socket.emit("ready");
        });

        // Relay DeepGram messages to client
        deepgramSession.emitter.on("message", (msg: any) => {
          let eventType = "info";
          if (msg.is_final) eventType = "final";
          else if (
            msg.type === "partial_transcript" ||
            msg.type === "final_transcript"
          )
            eventType = "partial";

          logger.debug(
            {
              sessionId: deepgramSession?.id,
              eventType,
              transcript: msg.transcript,
            },
            "Sending transcript to client"
          );

          socket.emit(`transcript.${eventType}`, {
            transcript: msg.transcript,
            is_final: msg.is_final,
            confidence: msg.confidence,
            type: msg.type,
          });
        });

        deepgramSession.emitter.on("error", (err: any) => {
          logger.error(
            { err, sessionId: deepgramSession?.id },
            "DeepGram session error"
          );
          socket.emit("deepgram.error", { message: String(err) });
        });

        deepgramSession.emitter.on("closed", () => {
          logger.info(
            { sessionId: deepgramSession?.id },
            "DeepGram session closed"
          );
          socket.emit("session.closed");
        });
      } catch (err) {
        logger.error({ err }, "Failed to start DeepGram session");
        socket.emit("error", {
          message: "Failed to start transcription session",
        });
      }
    });

    socket.on("audio", (chunk: ArrayBuffer) => {
      if (!deepgramSession) {
        socket.emit("error", {
          message: "Session not initialized. Call start first.",
        });
        return;
      }

      const buf = Buffer.from(chunk);

      try {
        // Send audio chunk directly to DeepGram when ready
        const sent = sendAudioToDeepGram(deepgramSession, buf);
        if (!sent) {
          // If DeepGram is not ready, log and discard the chunk
          logger.warn("DeepGram WebSocket not ready, discarding audio chunk");
        }
      } catch (err) {
        logger.error({ err }, "Failed to forward audio chunk to DeepGram");
        socket.emit("error", { message: "Failed to forward audio" });
      }
    });

    socket.on("stop", async () => {
      try {
        if (
          deepgramSession &&
          deepgramSession.ws &&
          deepgramSession.ws.readyState === WebSocket.OPEN
        ) {
          // ✅ 1. Tell DeepGram we've finished sending audio
          deepgramSession.ws.send(JSON.stringify({ type: "CloseStream" }));

          logger.info(
            { sessionId: deepgramSession.id },
            "Sent CloseStream to DeepGram"
          );

          // ✅ 2. Wait briefly (or listen for final message) before closing
          deepgramSession.emitter.once("message", (msg: any) => {
            if (msg.is_final || msg.type === "final_transcript") {
              logger.info("Received final transcription:", msg);
              socket.emit("transcript.final", msg);
              if (deepgramSession?.ws) {
                deepgramSession.ws.close();
              }
              socket.emit("stopped");
            }
          });

          // Optional safety close if no final message after 5 seconds
          setTimeout(() => {
            if (deepgramSession?.ws?.readyState === WebSocket.OPEN) {
              deepgramSession.ws.close();
              socket.emit("stopped");
            }
          }, 5000);
        }
      } catch (err) {
        logger.warn({ err }, "Error stopping session");
      }
    });

    socket.on("disconnect", (reason) => {
      logger.info({ sid: socket.id, reason }, "Client disconnected");
      if (deepgramSession) {
        closeDeepGramSession(deepgramSession);
      }
    });
  });

  return io;
}
