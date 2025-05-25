import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FileText, FileImage, FileAudio, Film, Clock, Download } from 'lucide-react';

// Dosya eki tipi
export type Attachment = {
  id: string;
  name: string;
  type: 'document' | 'image' | 'audio' | 'video';
  url: string;
};

// Message tipi
export interface Message {
  id: string;
  content: string;
  timestamp: string;
  sender: 'student' | 'advisor';
  senderName: string;
  attachments?: Attachment[];
}

interface MessageListProps {
  messages: Message[];
}

const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'document':
        return <FileText size={16} />;
      case 'image':
        return <FileImage size={16} />;
      case 'audio':
        return <FileAudio size={16} />;
      case 'video':
        return <Film size={16} />;
      default:
        return <FileText size={16} />;
    }
  };

  const renderAttachment = (attachment: Attachment, sender: 'student' | 'advisor') => {
    console.log('Rendering attachment:', attachment);

    if (attachment.type === 'image') {
      return (
        <div className="mt-2">
          <img 
            src={attachment.url} 
            alt={attachment.name}
            className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
            style={{ maxHeight: '200px' }}
            onClick={() => window.open(attachment.url, '_blank')}
          />
          <div className="text-xs mt-1 flex items-center">
            <span className="mr-2">{attachment.name}</span>
            <a
              href={attachment.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              <Download size={14} />
            </a>
          </div>
        </div>
      );
    }

    return (
      <a
        href={attachment.url}
        target="_blank"
        rel="noopener noreferrer"
        className={`flex items-center p-2 rounded ${
          sender === 'student'
            ? 'bg-primary-dark hover:bg-primary-light'
            : 'bg-gray-100 hover:bg-gray-200'
        } transition-colors duration-200`}
      >
        <span className="mr-2">{getFileIcon(attachment.type)}</span>
        <span className="truncate text-sm flex-1">{attachment.name}</span>
        <Download size={16} className="ml-2" />
      </a>
    );
  };

  return (
    <div className="space-y-4 p-4">
      {messages.map((message, index) => (
        <motion.div
          key={message.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          className={`flex ${message.sender === 'student' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[80%] rounded-lg p-4 shadow-sm ${
              message.sender === 'student'
                ? 'bg-primary text-white rounded-br-none'
                : 'bg-white text-gray-800 rounded-bl-none'
            }`}
          >
            <div className="text-sm">
              {message.sender === 'advisor' && (
                <div className="font-medium mb-1 text-secondary">{message.senderName}</div>
              )}
              {message.content && <p>{message.content}</p>}
              
              {message.attachments && message.attachments.length > 0 && (
                <div className="mt-3 space-y-2">
                  {message.attachments.map(attachment => (
                    <div key={attachment.id}>
                      {renderAttachment(attachment, message.sender)}
                    </div>
                  ))}
                </div>
              )}
              
              <div className={`text-xs mt-2 flex items-center ${
                message.sender === 'student' ? 'text-primary-light' : 'text-gray-500'
              }`}>
                <Clock size={12} className="mr-1" />
                {message.timestamp}
              </div>
            </div>
          </div>
        </motion.div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;