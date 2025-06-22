import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Clock, MapPin } from 'lucide-react';
import axios from 'axios';

export interface Advisor {
  id: number;
  name: string;
  surname: string;
  email: string;
  username: string;
  photoUrl?: string | null;
  officeNumber?: string;
  officeHoursStart?: string;
  officeHoursEnd?: string;
  officeDays?: string;
}

interface AdvisorListProps {
  selectedAdvisorId: string | null;
  onSelectAdvisor: (advisorId: string) => void;
}

const AdvisorList: React.FC<AdvisorListProps> = ({ 
  selectedAdvisorId, 
  onSelectAdvisor 
}) => {
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAdvisors = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await axios.get('http://localhost:5000/api/advisors');
        const formattedAdvisors = response.data.map((advisor: any) => {
          const formatTime = (time: string | null) => {
            if (!time) return null;
            try {
              if (time.match(/^\d{2}:\d{2}$/)) return time;
              const timeStr = time.split('T')[1] || time;
              return timeStr.split(':').slice(0, 2).join(':');
            } catch (e) {
              return null;
            }
          };

          return {
            ...advisor,
            photoUrl: advisor.photo_url,
            officeNumber: advisor.office_number,
            officeHoursStart: formatTime(advisor.office_hours_start),
            officeHoursEnd: formatTime(advisor.office_hours_end),
            officeDays: advisor.office_days
          };
        });
        setAdvisors(formattedAdvisors);
      } catch (error: any) {
        console.error('Error fetching advisors:', error);
        setError(error.response?.data?.error || 'Danışman listesi alınırken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchAdvisors();
  }, []);

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

  if (advisors.length === 0) {
    return (
      <div className="text-center p-4 text-gray-500">
        Henüz danışman bulunmuyor.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="text-lg font-semibold mb-4">Danışmanlar ({advisors.length})</div>
      
      {advisors.map((advisor, index) => (
        <motion.div
          key={advisor.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: index * 0.05 }}
        >
          <button
            onClick={() => onSelectAdvisor(advisor.id.toString())}
            className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
              selectedAdvisorId === advisor.id.toString()
                ? 'bg-primary text-white'
                : 'bg-white hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center">
              <div 
                className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-medium overflow-hidden ${
                  selectedAdvisorId === advisor.id.toString() ? 'bg-white text-primary' : 'bg-primary'
                }`}
                style={{
                  backgroundImage: advisor.photoUrl ? `url(${advisor.photoUrl})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                {!advisor.photoUrl && `${advisor.name.charAt(0)}${advisor.surname.charAt(0)}`}
              </div>
              
              <div className="ml-3 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{advisor.name} {advisor.surname}</span>
                </div>
                
                <div className={`text-sm ${
                  selectedAdvisorId === advisor.id.toString() ? 'text-gray-100' : 'text-gray-500'
                }`}>
                  {advisor.email}
                </div>

                {advisor.officeNumber && (
                  <div className={`text-sm mt-1 flex items-center ${
                    selectedAdvisorId === advisor.id.toString() ? 'text-gray-100' : 'text-gray-500'
                  }`}>
                    <MapPin size={14} className="mr-1" />
                    Ofis: {advisor.officeNumber}
                  </div>
                )}

                {advisor.officeHoursStart && advisor.officeHoursEnd && (
                  <div className={`text-sm mt-1 flex items-center ${
                    selectedAdvisorId === advisor.id.toString() ? 'text-gray-100' : 'text-gray-500'
                  }`}>
                    <Clock size={14} className="mr-1" />
                    {advisor.officeHoursStart} - {advisor.officeHoursEnd}
                    {advisor.officeDays && ` (${advisor.officeDays})`}
                  </div>
                )}
              </div>
            </div>
          </button>
        </motion.div>
      ))}
    </div>
  );
};

export default AdvisorList; 