import React from 'react';
import { Check, CheckCircle2 } from 'lucide-react';

export const MessageStatus = ({ status }: { status: 'sent' | 'delivered' | 'seen' | 'failed' | 'sending' }) => {
  if (status === 'sending') {
    return <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300 border-t-primary animate-spin mt-1" />;
  }
  if (status === 'sent') {
    return <Check className="w-3.5 h-3.5 text-gray-400 mt-1" />;
  }
  if (status === 'delivered') {
    return <CheckCircle2 className="w-3.5 h-3.5 text-gray-400 mt-1" />;
  }
  return null;
};
