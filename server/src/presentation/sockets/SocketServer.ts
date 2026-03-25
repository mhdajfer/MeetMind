import { Server as HttpServer } from "http";
import { Server as IOServer, Socket } from "socket.io";
import {
  initDeepgramSession,
  connectToDeepgram,
  sendAudioToDeepgram,
  closeDeepgramSession,
  DeepgramSession,
} from "../../infrastructure/services/deepgram/DeepgramService";
import { logger } from "../../shared/utils/logger";
import { FRONTEND_ORIGIN } from "../../shared/config/environment";
import WebSocket from "ws";

export function initSocketServer(server: HttpServer) {
  const io = new IOServer(server, {
    cors: {
      origin: FRONTEND_ORIGIN,
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket: Socket) => {
    logger.info({ sid: socket.id }, "Client connected");

    let deepgramSession: DeepgramSession | null = null;

    socket.on("start", async (_meta: any = {}) => {
      try {
        deepgramSession = await initDeepgramSession();
        connectToDeepgram(deepgramSession);

        deepgramSession.emitter.on("connected", () => {
          logger.info("Deepgram WS connected, ready to receive audio");
          socket.emit("ready");
        });

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
            "Deepgram session error"
          );
          socket.emit("deepgram.error", { message: String(err) });
        });

        deepgramSession.emitter.on("closed", () => {
          logger.info(
            { sessionId: deepgramSession?.id },
            "Deepgram session closed"
          );
          socket.emit("session.closed");
        });
      } catch (err) {
        logger.error({ err }, "Failed to start Deepgram session");
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
        const sent = sendAudioToDeepgram(deepgramSession, buf);
        if (!sent) {
          logger.warn("Deepgram WebSocket not ready, discarding audio chunk");
        }
      } catch (err) {
        logger.error({ err }, "Failed to forward audio chunk to Deepgram");
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
          deepgramSession.ws.send(JSON.stringify({ type: "CloseStream" }));

          logger.info(
            { sessionId: deepgramSession.id },
            "Sent CloseStream to Deepgram"
          );

          deepgramSession.emitter.once("message", (msg: any) => {
            if (msg.is_final || msg.type === "final_transcript") {
              logger.info("Received final transcription");
              socket.emit("transcript.final", msg);
              if (deepgramSession?.ws) {
                deepgramSession.ws.close();
              }
              socket.emit("stopped");
            }
          });

          // Safety close after 5 seconds
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
        closeDeepgramSession(deepgramSession);
      }
    });
  });

  return io;
}

