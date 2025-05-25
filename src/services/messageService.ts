import axios from 'axios';

const API_URL = 'http://localhost:5000';

export interface Message {
  id: string;
  content: string;
  timestamp: string;
  sender: 'student' | 'advisor';
  senderName: string;
  senderId: string;
  receiverId: string;
  read: boolean;
  attachments?: {
    id: string;
    name: string;
    type: 'document' | 'image' | 'audio' | 'video';
    url: string;
  }[];
}

export const messageService = {
  // Get messages between student and advisor
  async getMessages(studentId: string, advisorId: string): Promise<Message[]> {
    const response = await axios.get(`${API_URL}/api/messages`, {
      params: { studentId, advisorId }
    });
    return response.data.map((msg: any) => ({
      id: msg.id.toString(),
      content: msg.content,
      timestamp: new Date(msg.created_at).toLocaleTimeString(),
      sender: msg.sender_type,
      senderName: msg.sender_name,
      senderId: msg.sender_id.toString(),
      receiverId: msg.receiver_id.toString(),
      read: msg.read,
      attachments: msg.attachments
    }));
  },

  // Send a new message
  async sendMessage(message: any): Promise<Message> {
    const response = await axios.post(`${API_URL}/api/messages`, message);
    return {
      id: response.data.id.toString(),
      content: response.data.content,
      timestamp: response.data.timestamp || new Date(response.data.created_at).toLocaleTimeString(),
      sender: response.data.sender_type,
      senderName: response.data.senderName,
      senderId: response.data.sender_id.toString(),
      receiverId: response.data.receiver_id.toString(),
      read: response.data.read,
      attachments: response.data.attachments
    };
  },

  // Upload file attachment
  async uploadAttachment(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post(`${API_URL}/api/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }
}; 