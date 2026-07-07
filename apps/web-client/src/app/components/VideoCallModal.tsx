"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import toast from 'react-hot-toast';

type CallUser = {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
};

export type CallData = {
  isReceivingCall: boolean;
  from: string;
  callerName: string;
  callerAvatar?: string;
  signal: RTCSessionDescriptionInit;
  isVideo: boolean;
};

interface VideoCallModalProps {
  socket: Socket | null;
  currentUser: CallUser;
  targetUser: CallUser | null; // Null if receiving call from someone not active
  callData: CallData | null;
  onEndCall: () => void;
  isInitiator: boolean;
  isVideo: boolean;
}

export default function VideoCallModal({
  socket,
  currentUser,
  targetUser,
  callData,
  onEndCall,
  isInitiator,
  isVideo
}: VideoCallModalProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const myVideo = useRef<HTMLVideoElement>(null);
  const userVideo = useRef<HTMLVideoElement>(null);
  const connectionRef = useRef<RTCPeerConnection | null>(null);
  const iceCandidatesBuffer = useRef<RTCIceCandidateInit[]>([]);

  const createPeerConnection = useCallback((currentStream: MediaStream, targetId: string) => {
    const peer = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' }
      ]
    });

    currentStream.getTracks().forEach(track => {
      peer.addTrack(track, currentStream);
    });

    peer.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    peer.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('iceCandidate', {
          to: targetId,
          candidate: event.candidate
        });
      }
    };

    connectionRef.current = peer;
    return peer;
  }, [socket]);

  const startCall = useCallback(async (currentStream: MediaStream) => {
    if (!socket || !targetUser) return;
    const peer = createPeerConnection(currentStream, targetUser.id);
    
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);

    socket.emit('callUser', {
      userToCall: targetUser.id,
      signalData: offer,
      from: currentUser.id,
      callerName: currentUser.fullName,
      callerAvatar: currentUser.avatarUrl,
      isVideo
    });
  }, [createPeerConnection, currentUser.avatarUrl, currentUser.fullName, currentUser.id, isVideo, socket, targetUser]);

  const answerCall = async () => {
    if (!callData || !stream || !socket) return;
    setCallAccepted(true);

    const peer = createPeerConnection(stream, callData.from);
    
    await peer.setRemoteDescription(new RTCSessionDescription(callData.signal));
    
    iceCandidatesBuffer.current.forEach(c => peer.addIceCandidate(new RTCIceCandidate(c)).catch(e => console.error(e)));
    iceCandidatesBuffer.current = [];

    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);

    socket.emit('answerCall', {
      to: callData.from,
      signal: answer
    });
  };

  const stopScreenShare = useCallback(() => {
    if (!stream || !connectionRef.current) return;
    const videoTrack = stream.getVideoTracks()[0];
    const sender = connectionRef.current.getSenders().find((s) => s.track?.kind === 'video');
    if (sender && videoTrack) {
      sender.replaceTrack(videoTrack);
    }
    if (myVideo.current) {
      myVideo.current.srcObject = stream;
    }
    setIsScreenSharing(false);
  }, [stream]);

  const toggleScreenShare = async () => {
    if (!stream || !connectionRef.current) return;
    
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        
        screenTrack.onended = () => {
          stopScreenShare();
        };

        const sender = connectionRef.current.getSenders().find((s) => s.track?.kind === 'video');
        if (sender) {
          sender.replaceTrack(screenTrack);
        }
        
        if (myVideo.current) {
          myVideo.current.srcObject = screenStream;
        }
        setIsScreenSharing(true);
      } catch (err) {
        console.error("Failed to share screen", err);
      }
    } else {
      stopScreenShare();
    }
  };

  const toggleAudio = useCallback(() => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioMuted(!audioTrack.enabled);
      }
    }
  }, [stream]);

  const toggleVideo = useCallback(() => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoMuted(!videoTrack.enabled);
      }
    }
  }, [stream]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleEndCall = useCallback((emitEvent = true) => {
    setCallEnded(true);
    if (connectionRef.current) {
      connectionRef.current.close();
      connectionRef.current = null;
    }
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    if (emitEvent && socket) {
      const targetId = isInitiator && targetUser ? targetUser.id : callData?.from;
      if (targetId) {
        socket.emit('endCall', { to: targetId });
      }
    }
    onEndCall();
  }, [callData?.from, isInitiator, onEndCall, socket, stream, targetUser]);

  useEffect(() => {
    if (myVideo.current && stream) {
      myVideo.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    if (userVideo.current && remoteStream) {
      userVideo.current.srcObject = remoteStream;
    }
  }, [remoteStream, callAccepted, callEnded]);

  useEffect(() => {
    let isCancelled = false;
    let localStream: MediaStream | null = null;

    // Get local media stream
    navigator.mediaDevices.getUserMedia({ video: isVideo, audio: true })
      .then((currentStream) => {
        if (isCancelled) {
          currentStream.getTracks().forEach(track => track.stop());
          return;
        }
        localStream = currentStream;
        setStream(currentStream);

        // If I am the initiator, I should start the call immediately after getting media
        if (isInitiator && targetUser && socket) {
          startCall(currentStream);
        }
      })
      .catch((err) => {
        if (isCancelled) return;
        console.error("Failed to get local stream", err);
        toast.error("Không thể truy cập Camera/Microphone");
        handleEndCall();
      });

    // Listeners for WebRTC events
    if (socket) {
      socket.on(`callAccepted-${currentUser.id}`, async (signal: RTCSessionDescriptionInit) => {
        setCallAccepted(true);
        if (connectionRef.current) {
          await connectionRef.current.setRemoteDescription(new RTCSessionDescription(signal));
          iceCandidatesBuffer.current.forEach(c => connectionRef.current?.addIceCandidate(new RTCIceCandidate(c)).catch(e => console.error(e)));
          iceCandidatesBuffer.current = [];
        }
      });

      socket.on(`iceCandidate-${currentUser.id}`, (candidate: RTCIceCandidateInit) => {
        if (connectionRef.current && connectionRef.current.remoteDescription) {
          connectionRef.current.addIceCandidate(new RTCIceCandidate(candidate)).catch(e => console.error(e));
        } else {
          iceCandidatesBuffer.current.push(candidate);
        }
      });

      socket.on(`callEnded-${currentUser.id}`, () => {
        handleEndCall(false); // Remote ended
      });
    }

    return () => {
      isCancelled = true;
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (socket) {
        socket.off(`callAccepted-${currentUser.id}`);
        socket.off(`iceCandidate-${currentUser.id}`);
        socket.off(`callEnded-${currentUser.id}`);
      }
    };
  }, [currentUser.id, handleEndCall, isInitiator, isVideo, socket, startCall, targetUser]);

  return (
    <div ref={containerRef} className={`fixed inset-0 bg-black/95 z-[9999] flex flex-col items-center justify-center backdrop-blur-xl ${isFullscreen ? 'p-0' : 'p-4'}`}>
      {/* HEADER */}
      <div className="absolute top-8 text-center">
        <h2 className="text-2xl font-bold text-white mb-2">
          {isInitiator ? `Đang gọi ${targetUser?.fullName}...` : `${callData?.callerName} đang gọi...`}
        </h2>
        <p className="text-gray-400">{isVideo ? 'Cuộc gọi Video' : 'Cuộc gọi Thoại'}</p>
      </div>

      {/* VIDEOS */}
      <div className={`relative w-full ${isFullscreen ? 'h-full max-w-full rounded-none border-none' : 'max-w-6xl h-[75vh] rounded-3xl border border-white/10'} flex items-center justify-center overflow-hidden bg-[#0a0a0a] shadow-[0_0_80px_rgba(8,102,255,0.1)] transition-all duration-300`}>
        
        {/* Remote Video (Full Screen) */}
        {callAccepted && !callEnded ? (
          <video 
            playsInline 
            ref={userVideo} 
            autoPlay 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center animate-pulse">
            <img 
              src={isInitiator ? (targetUser?.avatarUrl || `https://i.pravatar.cc/150?u=${targetUser?.id}`) : (callData?.callerAvatar || `https://i.pravatar.cc/150?u=${callData?.from}`)} 
              alt="Avatar" 
              className="w-32 h-32 rounded-full object-cover shadow-2xl mb-4 border-4 border-white/10"
            />
            <p className="text-white/50">{isInitiator ? 'Đang chờ đổ chuông...' : 'Incoming call...'}</p>
          </div>
        )}

        {/* Local Video (PiP) */}
        {(stream && isVideo) && (
          <div className="absolute top-6 right-6 w-32 h-48 md:w-48 md:h-72 bg-black rounded-xl overflow-hidden shadow-2xl border-2 border-white/20 z-10 transition-all duration-300 hover:scale-105">
            <video 
              playsInline 
              muted 
              ref={myVideo} 
              autoPlay 
              className="w-full h-full object-cover scale-x-[-1]"
            />
          </div>
        )}
      </div>

      {/* CONTROLS */}
      <div className={`absolute ${isFullscreen ? 'bottom-8' : 'bottom-6'} flex items-center gap-4 bg-white/10 backdrop-blur-lg px-8 py-4 rounded-full border border-white/20 shadow-2xl transition-all duration-300`}>
        {/* Accept Call Button (Only for Receiver before accepting) */}
        {!isInitiator && !callAccepted && (
          <button 
            onClick={answerCall}
            className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-[0_0_20px_rgba(34,197,94,0.5)]"
          >
            <svg width="28" height="28" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
          </button>
        )}

        {/* Audio Toggle Button */}
        {callAccepted && !callEnded && (
          <button 
            onClick={toggleAudio}
            className={`w-14 h-14 rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-lg ${isAudioMuted ? 'bg-red-500/90 text-white' : 'bg-white/20 text-white hover:bg-white/30'}`}
            title={isAudioMuted ? 'Bật Mic' : 'Tắt Mic'}
          >
            {isAudioMuted ? (
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/><line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2"/></svg>
            ) : (
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg>
            )}
          </button>
        )}

        {/* Video Toggle Button */}
        {callAccepted && !callEnded && isVideo && (
          <button 
            onClick={toggleVideo}
            className={`w-14 h-14 rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-lg ${isVideoMuted ? 'bg-red-500/90 text-white' : 'bg-white/20 text-white hover:bg-white/30'}`}
            title={isVideoMuted ? 'Bật Camera' : 'Tắt Camera'}
          >
            {isVideoMuted ? (
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/><line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2"/></svg>
            ) : (
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
            )}
          </button>
        )}

        {/* Screen Share Button */}
        {callAccepted && !callEnded && isVideo && (
          <button 
            onClick={toggleScreenShare}
            className={`w-14 h-14 rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-lg ${isScreenSharing ? 'bg-blue-500/90' : 'bg-white/20 hover:bg-white/30'} text-white`}
            title={isScreenSharing ? 'Dừng chia sẻ' : 'Chia sẻ màn hình'}
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </button>
        )}

        {/* Fullscreen Button */}
        {callAccepted && !callEnded && (
          <button 
            onClick={toggleFullscreen}
            className="w-14 h-14 rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-lg bg-white/20 text-white hover:bg-white/30"
            title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
          >
            {isFullscreen ? (
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3"/></svg>
            ) : (
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/></svg>
            )}
          </button>
        )}

        {/* End Call Button */}
        <button 
          onClick={() => handleEndCall(true)}
          className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-[0_0_30px_rgba(220,38,38,0.6)] ml-2"
          title="Kết thúc cuộc gọi"
        >
           <svg width="28" height="28" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.516l2.257-1.13a1 1 0 00.502-1.21L9.684 3.684A1 1 0 008.736 3H5z"/></svg>
        </button>
      </div>
    </div>
  );
}
