import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

export interface Student {
  id: number;
  student_id: string;
  name: string;
  surname: string;
  email: string;
  last_message?: string;
  last_message_time?: string;
  unread_count: number;
}

interface StudentListProps {
  selectedStudentId: string | null;
  onSelectStudent: (studentId: string) => void;
}

const StudentList: React.FC<StudentListProps> = ({ 
  selectedStudentId, 
  onSelectStudent
}) => {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudents = async () => {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);
        console.log('Fetching students for advisor:', user.id);
        
        const response = await axios.get(`http://localhost:5000/api/advisor/${user.id}/students`);
        console.log('Fetched students:', response.data);
        
        if (Array.isArray(response.data)) {
          const allStudents = response.data.filter((student: Student) => student !== null);
          console.log('Filtered students:', allStudents);
          setStudents(allStudents);
        } else {
          console.error('Invalid response format:', response.data);
          setError('Geçersiz veri formatı');
        }
      } catch (error: any) {
        console.error('Error fetching students:', error);
        setError(error.response?.data?.error || 'Öğrenci listesi alınırken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
    // Her 1 dakikada bir güncelle
    const interval = setInterval(fetchStudents, 60000);
    return () => clearInterval(interval);
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-4">
        <div className="text-red-500 mb-2">{error}</div>
        <button 
          onClick={() => window.location.reload()}
          className="text-primary hover:underline"
        >
          Yeniden Dene
        </button>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="text-center p-4 text-gray-500">
        Size atanmış öğrenci bulunmuyor.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="text-lg font-semibold mb-4">Öğrencilerim ({students.length})</div>
      
      {students.map((student, index) => (
        <motion.div
          key={student.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: index * 0.05 }}
        >
          <button
            onClick={() => onSelectStudent(student.id.toString())}
            className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
              selectedStudentId === student.id.toString()
                ? 'bg-primary text-white'
                : 'bg-white hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-medium ${
                selectedStudentId === student.id.toString() ? 'bg-white text-primary' : 'bg-primary'
              }`}>
                {student.name.charAt(0)}{student.surname.charAt(0)}
              </div>
              
              <div className="ml-3 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{student.name} {student.surname}</span>
                  {student.unread_count > 0 && (
                    <span className={`h-5 w-5 rounded-full flex items-center justify-center text-xs ${
                      selectedStudentId === student.id.toString() ? 'bg-white text-primary' : 'bg-primary text-white'
                    }`}>
                      {student.unread_count}
                    </span>
                  )}
                </div>
                
                <div className={`text-sm ${
                  selectedStudentId === student.id.toString() ? 'text-gray-100' : 'text-gray-500'
                }`}>
                  {student.student_id}
                </div>
                
                {student.last_message ? (
                  <div className="flex items-center mt-1">
                    <MessageSquare size={14} className="mr-1" />
                    <span className={`text-xs truncate ${
                      selectedStudentId === student.id.toString() ? 'text-gray-100' : 'text-gray-500'
                    }`}>
                      {student.last_message}
                    </span>
                    {student.last_message_time && (
                      <span className={`text-xs ml-2 flex items-center ${
                        selectedStudentId === student.id.toString() ? 'text-gray-100' : 'text-gray-500'
                      }`}>
                        <Clock size={10} className="mr-1" />
                        {new Date(student.last_message_time).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          </button>
        </motion.div>
      ))}
    </div>
  );
};

export default StudentList;