import { io } from "socket.io-client";

const client = io("http://localhost:4000", {
  transports: ["websocket"],
});

console.log("Sending message");

client.on("connect", () => {
  client.emit("join_conversation", "conversation1");

  client.emit("subscribe_notifications", "sender1");

  client.emit(
    "send_message",
    {
      conversationId: "conversation1",
      content: "Hello from sender client",
      receiverId: "receiver1",
    },
    (response: any) => {
      console.log(response);
    }
  );

  client.on("receive_message", () => {
    console.log("Pesan diterima");
  });
});
