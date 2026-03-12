import { useEffect, useState } from "react";
import { io } from "socket.io-client";

export const useSocket = (token) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!token) return; // only connect if user has token

    const newSocket = io(
      import.meta.env.VITE_SERVER_URL || "http://localhost:5000",
      {
        auth: { token },
        transports: ["websocket"], // force websockets for stability
        reconnectionAttempts: 5,   // try reconnecting 5 times
        reconnectionDelay: 1000,   // wait 1s between retries
      }
    );

    // Debugging logs
    newSocket.on("connect", () =>
      console.log("✅ Socket connected:", newSocket.id)
    );
    newSocket.on("disconnect", (reason) =>
      console.log("❌ Socket disconnected:", reason)
    );
    newSocket.on("connect_error", (err) =>
      console.error("⚠️ Socket connection error:", err.message)
    );

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
      console.log("🔌 Socket disconnected cleanly");
    };
  }, [token]);

  return socket;
};
