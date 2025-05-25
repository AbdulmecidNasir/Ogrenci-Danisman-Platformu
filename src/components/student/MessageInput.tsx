import React, { useState, useRef } from 'react';
import { Send, Paperclip, X, Image, FileText, Film, FileAudio } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

interface MessageInputProps {
  onSendMessage: (content: string, files: File[]) => void;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage }) => {
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      
      // Her dosyayı yükle
      for (const file of newFiles) {
        try {
          const formData = new FormData();
          formData.append('file', file);

          const response = await axios.post('http://localhost:5000/api/upload', formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });

          // Dosyayı ekle
          setFiles(prev => [...prev, file]);
        } catch (error) {
          console.error('Error uploading file:', error);
        }
      }
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() || files.length > 0) {
      onSendMessage(message, files);
      setMessage('');
      setFiles([]);
      setShowAttachMenu(false);
    }
  };

  const triggerFileInput = (accept: string) => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = accept;
      fileInputRef.current.click();
    }
    setShowAttachMenu(false);
  };

  const getFileTypeIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image size={16} className="text-blue-500" />;
    if (type.startsWith('video/')) return <Film size={16} className="text-red-500" />;
    if (type.startsWith('audio/')) return <FileAudio size={16} className="text-green-500" />;
    return <FileText size={16} className="text-gray-500" />;
  };

  return (
    <div className="p-4 border-t border-gray-200 bg-white">
      {files.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="px-3 py-1 bg-gray-100 rounded-full flex items-center text-sm"
            >
              {getFileTypeIcon(file.type)}
              <span className="mx-2 truncate max-w-[150px]">{file.name}</span>
              <button
                onClick={() => removeFile(index)}
                className="text-gray-500 hover:text-red-500"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-center space-x-2">
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowAttachMenu(!showAttachMenu)}
            className="p-2 rounded-full text-gray-600 hover:bg-gray-100 focus:outline-none"
          >
            <Paperclip size={20} />
          </button>

          <AnimatePresence>
            {showAttachMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                className="absolute bottom-full left-0 mb-2 bg-white rounded-md shadow-lg border border-gray-200 overflow-hidden"
              >
                <div className="flex flex-col">
                  <button
                    type="button"
                    onClick={() => triggerFileInput('image/*')}
                    className="px-4 py-2 text-left hover:bg-gray-100 flex items-center"
                  >
                    <Image size={16} className="mr-2 text-blue-500" /> Fotoğraf
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerFileInput('video/*')}
                    className="px-4 py-2 text-left hover:bg-gray-100 flex items-center"
                  >
                    <Film size={16} className="mr-2 text-red-500" /> Video
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerFileInput('audio/*')}
                    className="px-4 py-2 text-left hover:bg-gray-100 flex items-center"
                  >
                    <FileAudio size={16} className="mr-2 text-green-500" /> Ses
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerFileInput('application/pdf,text/*,.doc,.docx,.xls,.xlsx,.ppt,.pptx')}
                    className="px-4 py-2 text-left hover:bg-gray-100 flex items-center"
                  >
                    <FileText size={16} className="mr-2 text-gray-500" /> Belge
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            multiple
          />
        </div>

        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Mesajınızı yazın..."
          className="flex-1 px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="submit"
          className="p-2 bg-primary text-white rounded-full hover:bg-primary-dark focus:outline-none"
          disabled={!message.trim() && files.length === 0}
        >
          <Send size={20} />
        </motion.button>
      </form>
    </div>
  );
};

export default MessageInput;