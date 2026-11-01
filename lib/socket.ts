"use client";

import { io, type Socket } from "socket.io-client";
import { useSyncExternalStore } from "react";
import { getAuthToken } from "@/lib/tokenStore";

/**
 * One shared live connection for the whole tab (WebSocket, falling back to polling). Pages ask for it with
 * useChatSocket(); the connection opens when the first page needs it and closes when the last one leaves.
 * Every (re)connect sends a fresh Clerk token, so a long-open tab keeps working.
 */
const URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
let socket: Socket | null = null;
let users = 0;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((f) => f());

export function acquireSocket(): Socket {
  if (!socket) {
    socket = io(URL, {
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 15_000,
      auth: (cb) => { getAuthToken({ skipCache: true }).then((t) => cb({ token: t ?? "" })).catch(() => cb({ token: "" })); },
    });
    socket.on("connect", notify);
    socket.on("disconnect", notify);
    socket.on("connect_error", notify);
  }
  users++;
  return socket;
}

export function releaseSocket() {
  users = Math.max(0, users - 1);
  if (users === 0 && socket) { socket.removeAllListeners(); socket.disconnect(); socket = null; notify(); }
}

/** True while the live connection is up. Pages poll as a fallback whenever this is false. */
export function useSocketConnected(): boolean {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => { listeners.delete(cb); }; },
    () => !!socket?.connected,
    () => false,
  );
}
