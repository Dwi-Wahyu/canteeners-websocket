export type ConnectedData = {
  user_id: string;
};

export type MessageData = {
  type:
    | "TEXT"
    | "SYSTEM"
    | "ORDER"
    | "PAYMENT_PROOF"
    | "JOIN_CONVERSATION"
    | "LEAVE_CONVERSATION"
    | "ACK_READ"
    | "ACK_DELIVERY"
    | "NEW_ORDER"
    | "SUBSCRIBE_ORDER"
    | "UNSUBSCRIBE_ORDER"
    | "UPDATE_ORDER";

  id: string;
  sender_id: string;
  conversation_id: string;
  receiver_id?: string;
  text?: string;
  is_read: boolean;
  media: MessageMedia[];
  order_id?: string;
  created_at: Date;
};

export type MessageMedia = {
  url: String;
  mime_type: "VIDEO" | "IMAGE";
  order_id?: String;
  message_id: String;
};
