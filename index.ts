import type { ConnectedData, MessageData } from "./types";

Bun.serve({
  hostname: "0.0.0.0",
  port: 4000,
  fetch(req, server) {
    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get("user_id");

    if (!user_id) {
      return new Response("Missing user_id", { status: 400 });
    }

    // upgrade the request to a WebSocket
    if (
      server.upgrade(req, {
        data: {
          user_id,
        },
      })
    ) {
      return undefined;
    }
    return new Response("Upgrade failed", { status: 500 });
  },
  websocket: {
    data: {} as ConnectedData,
    open(ws) {
      ws.subscribe(ws.data.user_id);
      console.log("Klien baru terkoneksi : " + ws.data.user_id);
    }, // a socket is opened
    message(ws, message) {
      let data: MessageData;

      try {
        data = JSON.parse(message as string);
      } catch (error) {
        ws.send(JSON.stringify({ error: "Message type not recognized" }));
        return;
      }

      if (!data.conversation_id) {
        ws.send(JSON.stringify({ error: "Please include conversation id" }));
        return;
      }

      let dataToSend: MessageData = {
        id: data.id,
        type: data.type,
        sender_id: ws.data.user_id,
        conversation_id: data.conversation_id,
        text: data.text,
        is_read: false,
        media: [],
        created_at: data.created_at,
      };

      switch (data.type) {
        case "JOIN_CONVERSATION":
          //   ws.publish(data.conversation_id, "ACK_READ");
          console.log("Join " + data.conversation_id);
          ws.subscribe(data.conversation_id);
          break;
        case "LEAVE_CONVERSATION":
          console.log("Leave " + data.conversation_id);
          ws.unsubscribe(data.conversation_id);
          break;
        case "ORDER":
          if (!data.order_id) {
            ws.send(JSON.stringify({ error: "Please include order id" }));
          }

          dataToSend["type"] = "ORDER";
          dataToSend["order_id"] = data.order_id;

          ws.send(JSON.stringify(dataToSend));
          break;
        case "TEXT":
          if (!data.text) {
            ws.send(JSON.stringify({ error: "Please send text" }));
          }
          console.log(data);

          ws.publish(data.conversation_id, JSON.stringify(dataToSend));

          break;
        default:
          ws.send(JSON.stringify({ error: "Message type not recognized" }));
          break;
      }
    }, // a message is received
    close(ws, code, message) {}, // a socket is closed
    drain(ws) {}, // the socket is ready to receive more data
  }, // handlers
});

console.log("Berjalan di http://localhost:4000");
