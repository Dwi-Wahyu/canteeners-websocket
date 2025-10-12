export type NewMessageData = {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  content?: string;
  image_url?: string;
  created_at: string;
};
