import { io } from "socket.io-client";
import type { NewMessageData } from "../type";

const client = io("http://localhost:4000", {
  transports: ["websocket"],
});

console.log("Receiving message");

client.on("connect", () => {
  client.emit("join_conversation", "conversation1");

  client.emit("subscribe_notifications", "receiver1");

  client.on("send_message", (data: NewMessageData) => {
    // console.log("Pesan baru masuk ", data.content);
    client.emit("receive_message", "conversation1");
  });

  client.on("new_message", (data) => {
    console.log("Notifikasi : pesan baru masuk");
  });
});
