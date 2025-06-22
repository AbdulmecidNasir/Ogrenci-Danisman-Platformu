import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../../components/Navbar';
import MessageList, { Message } from '../../components/student/MessageList';
import MessageInput from '../../components/student/MessageInput';
import AdvisorList, { Advisor } from '../../components/student/AdvisorList';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import { messageService } from '../../services/messageService';
import axios from 'axios';
import { MessageSquare } from 'lucide-react';

const StudentDashboard: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedAdvisorId, setSelectedAdvisorId] = useState<string | null>(null);
  const [selectedAdvisor, setSelectedAdvisor] = useState<Advisor | null>(null);
  const { user } = useAuth();

  // Seçili danışman değişince mesajları getir
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedAdvisorId || !user) return;

      try {
        console.log('Fetching messages for:', { studentId: user.id, advisorId: selectedAdvisorId });
        const fetchedMessages = await messageService.getMessages(user.id.toString(), selectedAdvisorId);
        console.log('Fetched messages:', fetchedMessages);
        setMessages(fetchedMessages);
      } catch (error) {
        console.error('Error fetching messages:', error);
        toast.error('Mesajlar yüklenirken bir hata oluştu');
      }
    };

    fetchMessages();
  }, [selectedAdvisorId, user]);

  // Auto-scroll to bottom of messages when new message is added
  useEffect(() => {
    const messagesContainer = document.getElementById('messages-container');
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (content: string, files: File[]) => {
    if (!user || !selectedAdvisorId) {
      console.error('No user or advisor selected');
      toast.error('Mesaj göndermek için bir danışman seçmelisiniz');
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
        receiverId: parseInt(selectedAdvisorId),
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
          {/* Sidebar with advisor list */}
          <div className="w-full md:w-1/3 p-4 border-r border-gray-200 bg-white overflow-y-auto">
            <AdvisorList
              selectedAdvisorId={selectedAdvisorId}
              onSelectAdvisor={setSelectedAdvisorId}
            />
          </div>
          
          {/* Chat area */}
          <div className="flex-1 flex flex-col">
            {selectedAdvisorId ? (
              <>
                {/* Header */}
                <div className="p-4 border-b border-gray-200 bg-white flex items-center">
                  <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-medium">
                    {selectedAdvisor?.name?.charAt(0)}{selectedAdvisor?.surname?.charAt(0)}
                  </div>
                  <div className="ml-3">
                    <h2 className="text-lg font-semibold">{selectedAdvisor?.name} {selectedAdvisor?.surname}</h2>
                    <div className="flex text-sm text-gray-500">
                      <span className="flex items-center">
                        {selectedAdvisor?.email}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 relative">
                  <div id="messages-container" className="absolute inset-0 overflow-y-auto p-4">
                    <MessageList messages={messages} />
                  </div>
                </div>

                {/* Message Input */}
                <div className="bg-white border-t border-gray-200">
                  <MessageInput onSendMessage={handleSendMessage} />
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-gray-50">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="text-center p-8"
                >
                  <div className="bg-primary text-white p-4 rounded-full inline-flex items-center justify-center mb-4">
                    <MessageSquare size={32} />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">Mesajlaşmaya Başlayın</h2>
                  <p className="text-gray-600">Sol taraftan bir danışman seçerek mesajlaşmaya başlayabilirsiniz.</p>
                </motion.div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;