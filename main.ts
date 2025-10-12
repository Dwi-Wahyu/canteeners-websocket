import { createServer } from "http";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import Redis from "ioredis";
import type { NewMessageData } from "./type";

// Konfigurasi koneksi Redis
const REDIS_HOST = "0.0.0.0";
const REDIS_PORT = 6379;

// 1. Buat klien Pub/Sub Redis
// Klien "pubClient" digunakan untuk menerbitkan pesan (publish)
const pubClient = new Redis({ host: REDIS_HOST, port: REDIS_PORT });

// Klien "subClient" harus di-duplicate dari pubClient karena klien Pub/Sub tidak dapat digunakan untuk tujuan lain
// Klien "subClient" digunakan untuk mendengarkan pesan (subscribe)
const subClient = pubClient.duplicate();

// 2. Buat HTTP server
const httpServer = createServer();

// 3. Buat instance Socket.IO Server
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Ganti dengan domain klien Anda
    methods: ["GET", "POST"],
  },
});

// 4. Pasang Redis Adapter ke Socket.IO
// Ini memungkinkan server untuk bertukar pesan dengan server Socket.IO lain melalui Redis
io.adapter(createAdapter(pubClient, subClient));

// 5. Tangani koneksi Socket.IO
io.on("connection", (socket) => {
  console.log(`Socket terhubung: ${socket.id}`);

  socket.on("join_conversation", (conversation_id) => {
    socket.join(conversation_id);
    console.log(`${socket.id} joined conversation ${conversation_id}`);
  });

  socket.on("subscribe_notifications", (userId) => {
    socket.join(userId);
    console.log(`${userId} subscribe notifications `);
  });

  socket.on("send_message", (data: NewMessageData, callback) => {
    console.log(data);

    socket.to(data.conversation_id).emit("send_message", data);

    io.to(data.receiver_id).emit("new_message", data);

    callback({
      status: "Pesan terkirim di server",
    });
  });

  socket.on("receive_message", (conversation_id) => {
    socket.to(conversation_id).emit("receive_message");
  });

  socket.on("leave_conversation", (conversation_id) => {
    socket.leave(conversation_id);
    console.log(`${socket.id} left conversation ${conversation_id}`);
  });

  socket.on("disconnect", () => {
    console.log(`Socket terputus: ${socket.id}`);
  });
});

// 6. Jalankan server di Bun
const PORT = 4000;
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Server Socket.IO berjalan di http://localhost:${PORT}`);
});
