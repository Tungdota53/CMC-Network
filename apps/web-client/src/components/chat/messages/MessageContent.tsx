import React from 'react';
import { ImageMessage } from '../media/ImageMessage';
import { VideoMessage } from '../media/VideoMessage';
import { FileMessage } from '../media/FileMessage';
import { VoiceMessage } from '../media/VoiceMessage';
import { LinkPreviewMessage } from '../media/LinkPreviewMessage';
import { PollMessage } from '../media/PollMessage';
import { LocationMessage } from '../media/LocationMessage';

export const MessageContent = ({ message, isMe }: { message: any, isMe: boolean }) => {
  switch (message.type) {
    case 'IMAGE':
      return <ImageMessage urls={message.metadata?.urls || [message.metadata?.url]} />;
    case 'VIDEO':
      return <VideoMessage url={message.metadata?.url} />;
    case 'FILE':
      return <FileMessage name={message.metadata?.name} size={message.metadata?.size} url={message.metadata?.url} />;
    case 'VOICE':
      return <VoiceMessage url={message.metadata?.url} />;
    case 'LINK':
      return <LinkPreviewMessage url={message.metadata?.url} title={message.metadata?.title} description={message.metadata?.description} image={message.metadata?.image} />;
    case 'POLL':
      return <PollMessage question={message.metadata?.question} options={message.metadata?.options} totalVotes={message.metadata?.totalVotes} />;
    case 'LOCATION':
      return <LocationMessage lat={message.metadata?.lat} lng={message.metadata?.lng} address={message.metadata?.address} />;
    case 'TEXT':
    default:
      return (
        <div
          className={`px-3 py-2 text-[15px] ${
            isMe ? 'bg-primary text-white' : 'bg-gray-100 text-gray-900'
          }`}
          style={{ borderRadius: 'inherit' }} // Inherit border radius from wrapper
        >
          {message.content}
        </div>
      );
  }
};
