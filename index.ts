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
          if (!data.conversation_id) {
            ws.send(
              JSON.stringify({ error: "Please include conversation id" })
            );
            return;
          }

          console.log("Join " + data.conversation_id);
          ws.subscribe(data.conversation_id);
          break;
        case "LEAVE_CONVERSATION":
          if (!data.conversation_id) {
            ws.send(
              JSON.stringify({ error: "Please include conversation id" })
            );
            return;
          }

          console.log("Leave " + data.conversation_id);
          ws.unsubscribe(data.conversation_id);
          break;
        case "ACK_READ":
          if (!data.conversation_id) {
            ws.send(JSON.stringify({ error: "Please send conversation id" }));
            return;
          }

          const ackData = {
            type: "ACK_READ",
            conversation_id: data.conversation_id,
            created_at: data.created_at,
          };

          ws.publish(data.conversation_id, JSON.stringify(ackData));

          console.log(
            "Membaca pesan di conversation id " + data.conversation_id
          );
          break;
        case "ORDER":
          if (!data.order_id) {
            ws.send(JSON.stringify({ error: "Please include order id" }));
            return;
          }

          if (!data.receiver_id) {
            ws.send(JSON.stringify({ error: "Please include owner id" }));
            return;
          }

          dataToSend["type"] = "ORDER";
          dataToSend["order_id"] = data.order_id;

          ws.send(JSON.stringify(dataToSend));

          break;
        case "TEXT":
          if (!data.conversation_id) {
            ws.send(
              JSON.stringify({ error: "Please include conversation id" })
            );
            return;
          }

          if (!data.text) {
            ws.send(JSON.stringify({ error: "Please send text" }));
            return;
          }
          console.log(data);

          ws.publish(data.conversation_id, JSON.stringify(dataToSend));

          break;
        case "SUBSCRIBE_ORDER":
          if (!data.order_id) {
            ws.send(JSON.stringify({ error: "Please send order id" }));
            return;
          }
          console.log("Subscribe order changes : " + data.order_id);
          ws.subscribe(data.order_id);
          break;
        case "UNSUBSCRIBE_ORDER":
          if (!data.order_id) {
            ws.send(JSON.stringify({ error: "Please send order id" }));
            return;
          }
          console.log("Unsubscribe order changes : " + data.order_id);
          ws.unsubscribe(data.order_id);
          break;
        case "UPDATE_ORDER":
          if (!data.order_id) {
            ws.send(JSON.stringify({ error: "Please send order id" }));
            return;
          }
          console.log("Update order changes : " + data.order_id);
          ws.publish(data.order_id, JSON.stringify({ type: "UPDATE_ORDER" }));
          break;
        case "NEW_ORDER":
          if (!data.receiver_id) {
            ws.send(JSON.stringify({ error: "Please send owner id" }));
            return;
          }
          if (!data.order_id) {
            ws.send(JSON.stringify({ error: "Please send order id" }));
            return;
          }
          console.log("Order baru muncul : " + data.order_id);
          ws.publish(
            data.receiver_id,
            JSON.stringify({ type: "NEW_ORDER", order_id: data.order_id })
          );
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
