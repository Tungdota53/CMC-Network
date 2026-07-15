"use client";
import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock, Video, Info, Loader2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';

interface MentorBookingFormProps {
  mentorId?: string;
  mentorName?: string;
}

export const MentorBookingForm = ({ mentorId, mentorName }: MentorBookingFormProps) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('09:00');
  const [topic, setTopic] = useState('');
  const bookingMutation = useMutation({
    mutationFn: async () => {
      if (!mentorId || !selectedDate) return;
      const scheduledAt = new Date(`${selectedDate}T${selectedTime}:00`);
      await api.post(`/mentors/${mentorId}/book`, {
        scheduledAt: scheduledAt.toISOString(),
        topic,
      });
    },
  });

  const availableTimes = ['09:00', '10:00', '14:00', '15:30', '19:00'];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">
        Đặt lịch hẹn{mentorName ? ` với ${mentorName}` : ''}
      </h3>
      
      <div className="space-y-6">
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
            <CalendarIcon className="w-4 h-4 text-gray-500" /> Ngày học
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-gray-700"
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
            <Clock className="w-4 h-4 text-gray-500" /> Giờ học (Có sẵn)
          </label>
          <div className="grid grid-cols-3 gap-2">
            {availableTimes.map(time => (
              <button 
                key={time}
                onClick={() => setSelectedTime(time)}
                className={`py-2 rounded-lg text-sm font-semibold transition-colors ${selectedTime === time ? 'bg-primary text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'}`}
              >
                {time}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
            Nội dung cần hỗ trợ
          </label>
          <textarea
            rows={3}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Mô tả ngắn gọn vấn đề bạn đang gặp phải..."
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none text-gray-700"
          ></textarea>
        </div>

        <div className="bg-blue-50 text-blue-800 p-4 rounded-xl flex items-start gap-3 text-[13px] font-medium">
          <Info className="w-5 h-5 shrink-0 text-blue-600" />
          <p>
            Bạn sẽ bị trừ <strong>50 Reputation Points</strong> khi Mentor xác nhận lịch. Session sẽ diễn ra qua Google Meet.
          </p>
        </div>

        <button
          onClick={() => bookingMutation.mutate()}
          disabled={!mentorId || !selectedDate || bookingMutation.isPending}
          className="w-full py-3.5 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {bookingMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Video className="w-5 h-5" />}
          {bookingMutation.isPending ? 'Đang gửi...' : 'Gửi yêu cầu đặt lịch'}
        </button>
        {bookingMutation.isError && (
          <p className="text-sm font-medium text-red-600">Không gửi được yêu cầu. Vui lòng kiểm tra lịch và thử lại.</p>
        )}
        {bookingMutation.isSuccess && (
          <p className="text-sm font-medium text-green-600">Đã gửi yêu cầu đặt lịch.</p>
        )}
      </div>
    </div>
  );
};
