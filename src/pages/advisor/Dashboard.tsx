import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../../components/Navbar';
import StudentList, { Student } from '../../components/advisor/StudentList';
import MessageList, { Message, Attachment } from '../../components/student/MessageList';
import MessageInput from '../../components/student/MessageInput';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import { Search, Mail, MessageSquare } from 'lucide-react';
import axios from 'axios';

const AdvisorDashboard: React.FC = () => {
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();

  // Seçili öğrenci değişince hem detayını hem mesajlarını çek
  useEffect(() => {
    const fetchStudentAndMessages = async () => {
      if (!selectedStudentId || !user) return;

      try {
        // Öğrenci bilgilerini getir
        const studentRes = await axios.get(`http://localhost:5000/api/advisor/${user.id}/students`);
        const student = studentRes.data.find((s: Student) => s.id.toString() === selectedStudentId);
        if (student) setSelectedStudent(student);
        else setSelectedStudent(null);

        // Mesajları getir
        const msgRes = await axios.get(`http://localhost:5000/api/messages`, {
          params: {
            studentId: selectedStudentId,
            advisorId: user.id
          }
        });

        const formattedMessages = msgRes.data.map((msg: any) => ({
          id: msg.id.toString(),
          content: msg.content,
          timestamp: new Date(msg.created_at).toLocaleTimeString(),
          sender: msg.sender_type.toLowerCase() as 'student' | 'advisor',
          senderName: msg.sender_name,
          attachments: msg.attachments || []
        }));

        setMessages(formattedMessages);

      } catch (error) {
        console.error('Error fetching student or messages:', error);
        toast.error('Veri alınırken bir hata oluştu.');
      }
    };

    fetchStudentAndMessages();

  }, [selectedStudentId, user]);

  // Yeni mesaj eklendiğinde en alta scroll et
  useEffect(() => {
    const container = document.getElementById('messages-container');
    if (container) container.scrollTop = container.scrollHeight;
  }, [messages]);

  const handleSendMessage = async (content: string, files: File[]) => {
    if (!selectedStudentId || !user || (!content.trim() && files.length === 0)) return;

    try {
      let attachments: Attachment[] = [];
      
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
        sender: 'advisor' as const,
        senderName: `${user.name} ${user.surname}`,
        senderId: user.id,
        receiverId: parseInt(selectedStudentId),
        attachments,
        read: false
      };

      console.log('Sending message:', newMessage);
      const response = await axios.post('http://localhost:5000/api/messages', newMessage);
      console.log('Message sent successfully:', response.data);

      const formattedMessage: Message = {
        id: response.data.id.toString(),
        content: response.data.content,
        timestamp: new Date(response.data.created_at).toLocaleTimeString(),
        sender: 'advisor',
        senderName: `${user.name} ${user.surname}`,
        attachments: response.data.attachments || []
      };

      setMessages(prev => [...prev, formattedMessage]);
      toast.success(files.length > 0 ? 'Dosya gönderildi' : 'Mesaj gönderildi');

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
      <Navbar title="Danışman Paneli" />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-full md:w-1/3 p-4 border-r border-gray-200 bg-white overflow-y-auto">
          <div className="mb-4 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Öğrenci ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <StudentList
            selectedStudentId={selectedStudentId}
            onSelectStudent={setSelectedStudentId}
          />
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedStudentId ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-gray-200 bg-white flex items-center">
                <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-medium">
                  {selectedStudent?.name?.charAt(0)}{selectedStudent?.surname?.charAt(0)}
                </div>
                <div className="ml-3">
                  <h2 className="text-lg font-semibold">{selectedStudent?.name} {selectedStudent?.surname}</h2>
                  <div className="flex text-sm text-gray-500">
                    <span className="mr-4">{selectedStudent?.student_id}</span>
                    <span className="flex items-center">
                      <Mail size={14} className="mr-1" /> {selectedStudent?.email}
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
                <p className="text-gray-600">Sol taraftan bir öğrenci seçerek mesajlaşmaya başlayabilirsiniz.</p>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvisorDashboard;
