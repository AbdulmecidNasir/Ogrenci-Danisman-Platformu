import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../../components/Navbar';
import MessageList, { Message } from '../../components/student/MessageList';
import MessageInput from '../../components/student/MessageInput';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import { messageService } from '../../services/messageService';
import axios from 'axios';

// Mock advisor data
const ADVISOR = {
  id: '1',
  name: 'Prof. Dr. Mehmet',
  surname: 'Yılmaz',
};

// Mock initial messages
const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    content: 'Merhaba, ben danışmanınız Prof. Dr. Mehmet Yılmaz. Herhangi bir sorunuz olduğunda bana mesaj gönderebilirsiniz.',
    timestamp: '15:30',
    sender: 'advisor',
    senderName: 'Prof. Dr. Mehmet Yılmaz',
  },
];

const StudentDashboard: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const { user } = useAuth();

  // Fetch messages when component mounts
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        if (user) {
          console.log('Fetching messages for:', { studentId: user.id, advisorId: ADVISOR.id });
          const fetchedMessages = await messageService.getMessages(user.id, ADVISOR.id);
          console.log('Fetched messages:', fetchedMessages);
          setMessages(fetchedMessages);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
        toast.error('Mesajlar yüklenirken bir hata oluştu');
      }
    };

    fetchMessages();
  }, [user]);

  // Auto-scroll to bottom of messages when new message is added
  useEffect(() => {
    const messagesContainer = document.getElementById('messages-container');
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (content: string, files: File[]) => {
    if (!user) {
      console.error('No user found');
      toast.error('Oturum açmanız gerekiyor');
      return;
    }

    try {
      let attachments = [];
      
      // Upload files if any
      if (files.length > 0) {
        console.log('Uploading files:', files);
        const uploadPromises = files.map(async (file) => {
          const formData = new FormData();
          formData.append('file', file);
          
          const response = await axios.post('http://localhost:5000/api/upload', formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });
          
          return response.data;
        });
        
        attachments = await Promise.all(uploadPromises);
        console.log('Uploaded attachments:', attachments);
      }

      const newMessage = {
        content: content || (files.length > 0 ? 'Dosya gönderildi' : ''),
        sender: 'student' as const,
        senderName: `${user.name} ${user.surname}`,
        senderId: user.id,
        receiverId: ADVISOR.id,
        attachments,
        read: false
      };

      console.log('Sending message:', newMessage);
      const sentMessage = await messageService.sendMessage(newMessage);
      console.log('Message sent successfully:', sentMessage);
      
      setMessages(prev => [...prev, sentMessage]);
      
      if (files.length > 0) {
        toast.success('Dosya başarıyla gönderildi');
      } else {
        toast.success('Mesaj gönderildi');
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.details || 
                          error.message || 
                          'Mesaj gönderilirken bir hata oluştu';
      toast.error(errorMessage);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Navbar title="Öğrenci Paneli" />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col md:flex-row">
          {/* Sidebar with advisor info */}
          <div className="w-full md:w-1/4 p-4 border-r border-gray-200 bg-white">
            <div className="text-lg font-semibold mb-2">Danışmanınız</div>
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="card p-4"
            >
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-white font-bold text-lg">
                  {ADVISOR.name.charAt(0)}{ADVISOR.surname.charAt(0)}
                </div>
                <div>
                  <div className="font-medium">{ADVISOR.name} {ADVISOR.surname}</div>
                  <div className="text-sm text-gray-500">Danışman</div>
                </div>
              </div>
            </motion.div>

            <div className="mt-6">
              <div className="text-lg font-semibold mb-2">Hızlı Bilgiler</div>
              <div className="card p-4 space-y-2">
                <div className="text-sm">
                  <span className="font-medium">E-posta:</span> {ADVISOR.name.toLowerCase()}.{ADVISOR.surname.toLowerCase()}@university.edu.tr
                </div>
                <div className="text-sm">
                  <span className="font-medium">Ofis Saatleri:</span> Pazartesi & Çarşamba 14:00-16:00
                </div>
                <div className="text-sm">
                  <span className="font-medium">Ofis:</span> Mühendislik Fakültesi B-204
                </div>
              </div>
            </div>
          </div>
          
          {/* Chat area */}
          <div className="flex-1 flex flex-col h-full">
            <div className="p-4 border-b border-gray-200 bg-white">
              <h2 className="text-lg font-semibold">Mesajlar</h2>
              <p className="text-sm text-gray-500">
                Danışmanınızla olan iletişiminiz
              </p>
            </div>
            
            <div className="flex-1 relative">
              <div id="messages-container" className="absolute inset-0 overflow-y-auto">
                <MessageList messages={messages} />
              </div>
            </div>
            
            <div className="bg-white border-t border-gray-200">
              <MessageInput onSendMessage={handleSendMessage} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;