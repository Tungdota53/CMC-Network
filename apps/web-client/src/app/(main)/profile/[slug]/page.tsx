'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Camera, MapPin, Briefcase, GraduationCap, Calendar, Plus, Medal, Home, Cake, Pencil, Image as ImageIcon, SlidersHorizontal, Settings2, List, Grid, X, Loader2, Save } from 'lucide-react';
import { useParams } from 'next/navigation';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { useFriendMutations, useFriends, useOutgoingRequests, useIncomingRequests } from '@/hooks/useFriends';
import { useRouter } from 'next/navigation';
import { CreatePost } from '@/components/feed/CreatePost';
import { PostCard } from '@/components/feed/PostCard';
import { Post, mapBackendPost } from '@/hooks/useFeed';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { ImageCropper } from '@/components/ui/ImageCropper';

export default function ProfilePage() {
  const router = useRouter();
  const { sendRequest, rejectRequest, acceptRequest, cancelRequest } = useFriendMutations();
  const { data: friendsData } = useFriends();
  const { data: outgoingRequests } = useOutgoingRequests();
  const { data: incomingRequests } = useIncomingRequests();

  const params = useParams();
  const slug = params?.slug as string;
  const decodedSlug = slug ? decodeURIComponent(slug) : '';
  
  const { user: authUser } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [profilePosts, setProfilePosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [friendStatus, setFriendStatus] = useState<'NONE' | 'PENDING' | 'INCOMING' | 'FRIENDS'>('NONE');
  const [editOpen, setEditOpen] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [editForm, setEditForm] = useState({ fullName: '', bio: '', location: '', department: '' });
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [cropType, setCropType] = useState<'avatar' | 'cover' | null>(null);
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const profileId = decodedSlug === 'me' || decodedSlug === 'undefined'
          ? authUser?.id
          : decodedSlug;

        if (!profileId) {
          if (!cancelled) setError('Không tìm thấy người dùng');
          return;
        }

        const response = await api.get(`/users/${encodeURIComponent(profileId)}/profile`);
        const userData = response.data.data;
        
        if (!userData) {
          if (!cancelled) setError('Không tìm thấy người dùng');
          return;
        }
        
        const userProfileData = {
          id: userData.id,
          fullName: userData.fullName || 'Sinh viên CMC',
          email: userData.email || '',
          studentId: userData.studentId || null,
          faculty: userData.department || null,
          major: userData.major || null,
          cohort: userData.cohort || null,
          bio: userData.bio || null,
          coverPhotoUrl: userData.coverPhotoUrl || null,
          avatarUrl: userData.avatarUrl,
          reputationScore: userData.reputationScore || 0,
          isVerified: userData.isVerified || false,
          hasBlueBadge: userData.hasBlueBadge || false,
          followers: userData.friendCount ?? 0,
          following: 0,
          address: userData.location || null,
          hometown: null,
          birthDate: null, 
          workExperience: [],
          education: userData.studentId || userData.department || userData.major || userData.cohort ? [
            {
              school: 'Trường Đại học CMC - CMC University',
              department: [userData.major, userData.department, userData.cohort].filter(Boolean).join(' • '),
              studentId: userData.studentId,
            }
          ] : [],
        };
        
        if (cancelled) return;
        
        setProfile(userProfileData);
        setEditForm({
          fullName: userProfileData.fullName || '',
          bio: userProfileData.bio || '',
          location: userProfileData.address || '',
          department: userData.department || '',
        });

        const postsResponse = await api.get(`/posts/user/${encodeURIComponent(userData.id)}?page=1&limit=20`);
        const postsData = postsResponse.data.data;
        if (!cancelled) {
          setProfilePosts((Array.isArray(postsData) ? postsData : postsData?.posts || []).map(mapBackendPost));
        }
      } catch (err: any) {
        console.error(err);
        if (!cancelled) {
          const backendError = err?.error?.message || err?.message;
          setError(backendError ? String(backendError) : JSON.stringify(err));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    if (decodedSlug && (decodedSlug !== 'me' || authUser?.id)) {
      fetchProfile();
    }
    return () => { cancelled = true; };
  }, [decodedSlug, authUser?.id]);

  // Sync actual friend status from backend
  useEffect(() => {
    if (!profile || authUser?.id === profile.id) return;
    
    if (friendsData?.friends?.some(f => f.id === profile.id)) {
      setFriendStatus('FRIENDS');
    } else if (outgoingRequests?.some(f => f.id === profile.id)) {
      setFriendStatus('PENDING');
    } else if (incomingRequests?.some(f => f.id === profile.id)) {
      setFriendStatus('INCOMING');
    } else {
      setFriendStatus('NONE');
    }
  }, [profile, friendsData, outgoingRequests, incomingRequests, authUser]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const profileId = decodedSlug === 'me' || decodedSlug === 'undefined'
        ? authUser?.id
        : decodedSlug;

      if (!profileId) {
        setError('Không tìm thấy người dùng');
        return;
      }

      const response = await api.get(`/users/${encodeURIComponent(profileId)}/profile`);
      const userData = response.data.data;
      
      if (!userData) {
        setError('Không tìm thấy người dùng');
        return;
      }
      
      const userProfileData = {
        id: userData.id,
        fullName: userData.fullName || 'Sinh viên CMC',
        email: userData.email || '',
        studentId: userData.studentId || null,
        faculty: userData.department || null,
        major: userData.major || null,
        cohort: userData.cohort || null,
        bio: userData.bio || null,
        coverPhotoUrl: userData.coverPhotoUrl || null,
        avatarUrl: userData.avatarUrl,
        reputationScore: userData.reputationScore || 0,
        isVerified: userData.isVerified || false,
        hasBlueBadge: userData.hasBlueBadge || false,
        followers: userData.friendCount ?? 0,
        following: 0,
        address: userData.location || null,
        hometown: null,
        birthDate: null, 
        workExperience: [],
        education: userData.studentId || userData.department || userData.major || userData.cohort ? [
          {
            school: 'Trường Đại học CMC - CMC University',
            department: [userData.major, userData.department, userData.cohort].filter(Boolean).join(' • '),
            studentId: userData.studentId,
          }
        ] : [],
      };
      
      setProfile(userProfileData);
      setEditForm({
        fullName: userProfileData.fullName || '',
        bio: userProfileData.bio || '',
        location: userProfileData.address || '',
        department: userData.department || '',
      });

      const postsResponse = await api.get(`/posts/user/${encodeURIComponent(userData.id)}?page=1&limit=20`);
      const postsData = postsResponse.data.data;
      setProfilePosts((Array.isArray(postsData) ? postsData : postsData?.posts || []).map(mapBackendPost));
    } catch (err: any) {
      console.error(err);
      const backendError = err?.error?.message || err?.message;
      setError(backendError ? String(backendError) : JSON.stringify(err));
    } finally {
      setLoading(false);
    }
  };

  const handleMessageClick = async () => {
    try {
      if (!profile?.id) return;
      const res = await api.post('/conversations', {
        type: 'DIRECT',
        participantIds: [profile.id]
      });
      if (res.data?.data?.id) {
        router.push(`/messages/t/${res.data.data.id}`);
      }
    } catch (err) {
      console.error('Failed to create/get conversation', err);
      alert('Không thể mở tin nhắn lúc này');
    }
  };

  const isOwner = authUser?.id === profile?.id;

  const handleSaveProfile = async () => {
    if (!isOwner || !profile?.id) return;
    try {
      setSavingProfile(true);
      const res = await api.put(`/users/${profile.id}/profile`, {
        fullName: editForm.fullName.trim(),
        bio: editForm.bio.trim() || null,
        location: editForm.location.trim() || null,
        department: editForm.department.trim() || null,
      });
      const updated = res.data?.data || res.data;
      setProfile((prev: any) => ({
        ...prev,
        fullName: updated.fullName ?? editForm.fullName.trim(),
        bio: updated.bio ?? (editForm.bio.trim() || null),
        address: updated.location ?? (editForm.location.trim() || null),
        faculty: updated.department ?? (editForm.department.trim() || null),
      }));
      setEditOpen(false);
    } catch (err) {
      console.error('Failed to update profile:', err);
      alert('Không thể cập nhật hồ sơ lúc này');
    } finally {
      setSavingProfile(false);
    }
  };

  const uploadImage = async (file: File, type: 'avatar' | 'cover') => {
    if (!isOwner || !profile?.id) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      if (type === 'avatar') setUploadingAvatar(true);
      else setUploadingCover(true);

      const res = await api.post(`/users/${profile.id}/${type}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const data = res.data?.data || res.data;
      setProfile((prev: any) => ({
        ...prev,
        avatarUrl: type === 'avatar' ? data.avatarUrl : prev.avatarUrl,
        coverPhotoUrl: type === 'cover' ? data.coverPhotoUrl : prev.coverPhotoUrl,
      }));
    } catch (err: any) {
      console.error(`Failed to upload ${type}:`, err);
      const errorMsg = err.response?.data?.message || err.message || '';
      alert(type === 'avatar' ? `Không thể tải ảnh đại diện. ${errorMsg}` : `Không thể tải ảnh bìa. ${errorMsg}`);
    } finally {
      if (type === 'avatar') setUploadingAvatar(false);
      else setUploadingCover(false);
    }
  };

  if (error) {
    return (
      <div className="max-w-[1090px] w-full pb-20 pt-20 text-center px-4">
        <h2 className="text-2xl font-bold text-foreground mb-4">{error}</h2>
        <button onClick={() => window.history.back()} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">Quay lại</button>
      </div>
    );
  }

  if (loading || !profile) {
    return (
      <div className="max-w-[1090px] w-full pb-20 animate-pulse px-4">
        <div className="h-96 bg-card rounded-b-lg"></div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mt-4">
          <div className="lg:col-span-2 h-64 bg-card rounded-lg"></div>
          <div className="lg:col-span-3 h-96 bg-card rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1090px] w-full pb-20 px-0 sm:px-4">
      {/* Cover & Avatar Header */}
      <div className="bg-card shadow-sm sm:rounded-b-lg mb-4 border-b sm:border border-border/50">
        {/* Cover Photo - Using a neutral abstract gradient instead of hardcoded image */}
        <div className="h-64 sm:h-[350px] bg-gradient-to-br from-primary/80 via-blue-500/50 to-purple-500/80 relative overflow-hidden sm:rounded-b-lg group">
          {profile.coverPhotoUrl && (
            <img src={profile.coverPhotoUrl} alt="Ảnh bìa" className="absolute inset-0 w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-black/10 mix-blend-overlay"></div>
          
          {isOwner && (
            <>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadImage(file, 'cover');
                  e.currentTarget.value = '';
                }}
              />
              <button
                onClick={() => coverInputRef.current?.click()}
                disabled={uploadingCover}
                className="absolute bottom-4 right-4 bg-white/90 hover:bg-white px-3 py-1.5 rounded-md text-gray-900 font-semibold text-[15px] flex items-center gap-2 transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {uploadingCover ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                <span className="hidden sm:inline">{uploadingCover ? 'Đang tải...' : 'Chỉnh sửa ảnh bìa'}</span>
              </button>
            </>
          )}
        </div>
        
        {/* Profile Info Section */}
        <div className="px-4 sm:px-8 relative pb-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between -mt-[84px] md:-mt-[30px] mb-4 gap-4">
            
            {/* Avatar & Name - FB Style */}
            <div className="flex flex-col md:flex-row items-center md:items-end gap-4 md:gap-6">
              <div className="relative inline-block shrink-0">
                <div className="rounded-full bg-card p-1 shadow-sm">
                  <Avatar fallback={profile.fullName.charAt(0)} src={profile.avatarUrl} className="w-[168px] h-[168px] border-4 border-card bg-primary/10 text-primary font-bold text-4xl" />
                </div>
                {isOwner && (
                  <>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = () => {
                            setCropImageSrc(reader.result as string);
                            setCropType('avatar');
                          };
                          reader.readAsDataURL(file);
                        }
                        e.currentTarget.value = '';
                      }}
                    />
                    <button
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={uploadingAvatar}
                      className="absolute bottom-3 right-3 w-9 h-9 bg-hover hover:bg-foreground/10 rounded-full flex items-center justify-center border-2 border-card transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {uploadingAvatar ? <Loader2 className="w-5 h-5 text-foreground animate-spin" /> : <Camera className="w-5 h-5 text-foreground" />}
                    </button>
                  </>
                )}
              </div>
              
              {/* Info Column */}
              <div className="flex flex-col items-center md:items-start pb-2 md:pb-4">
                <h1 className="text-[32px] font-bold text-foreground leading-tight flex items-center gap-2">
                  <span className="truncate max-w-[200px] sm:max-w-[300px] md:max-w-[400px] lg:max-w-[500px]">{profile.fullName}</span>
                  {profile.hasBlueBadge && <VerifiedBadge size={28} className="shrink-0" />}
                </h1>
                <p className="text-foreground/60 font-semibold text-[15px] mt-1 hover:underline cursor-pointer">
                  {profile.followers} người theo dõi • {profile.following} đang theo dõi
                </p>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-2 mb-4 w-full md:w-auto justify-center md:justify-end">
              {isOwner ? (
                <>
                  <button className="flex-1 md:flex-none px-4 py-2 bg-primary text-white font-semibold text-[15px] rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                    <Plus className="w-5 h-5" /> Bảng điều khiển
                  </button>
                  <button
                    onClick={() => setEditOpen(true)}
                    className="flex-1 md:flex-none px-4 py-2 bg-hover text-foreground font-semibold text-[15px] rounded-lg hover:bg-foreground/10 transition-colors flex items-center justify-center gap-2"
                  >
                    <Pencil className="w-4 h-4" /> Chỉnh sửa
                  </button>
                </>
              ) : (
                <>
                  {friendStatus === 'NONE' && (
                    <button 
                      onClick={() => sendRequest.mutate(profile.id)}
                      disabled={sendRequest.isPending}
                      className="flex-1 md:flex-none px-4 py-2 bg-primary text-white font-semibold text-[15px] rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Plus className="w-5 h-5" /> {sendRequest.isPending ? 'Đang xử lý...' : 'Thêm bạn bè'}
                    </button>
                  )}
                  {friendStatus === 'PENDING' && (
                    <button 
                      onClick={() => cancelRequest.mutate(profile.id)}
                      disabled={cancelRequest.isPending}
                      className="flex-1 md:flex-none px-4 py-2 bg-hover text-foreground font-semibold text-[15px] rounded-lg hover:bg-foreground/10 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {cancelRequest.isPending ? 'Đang xử lý...' : 'Hủy lời mời'}
                    </button>
                  )}
                  {friendStatus === 'INCOMING' && (
                    <button 
                      onClick={() => acceptRequest.mutate(profile.id)}
                      disabled={acceptRequest.isPending}
                      className="flex-1 md:flex-none px-4 py-2 bg-primary text-white font-semibold text-[15px] rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {acceptRequest.isPending ? 'Đang xử lý...' : 'Chấp nhận lời mời'}
                    </button>
                  )}
                  {friendStatus === 'FRIENDS' && (
                    <button 
                      className="flex-1 md:flex-none px-4 py-2 bg-hover text-foreground font-semibold text-[15px] rounded-lg hover:bg-foreground/10 transition-colors flex items-center justify-center gap-2"
                    >
                      Bạn bè
                    </button>
                  )}
                  <button 
                    onClick={handleMessageClick}
                    className="flex-1 md:flex-none px-4 py-2 bg-hover text-foreground font-semibold text-[15px] rounded-lg hover:bg-foreground/10 transition-colors flex items-center justify-center gap-2"
                  >
                    Nhắn tin
                  </button>
                </>
              )}
            </div>
          </div>
          
          {/* Profile Navigation */}
          <div className="border-t border-border/50 flex gap-1 overflow-x-auto no-scrollbar pt-1">
            {['Bài viết', 'Giới thiệu', 'Bạn bè', 'Ảnh', 'Video', 'Xem thêm'].map((tab, idx) => (
              <button 
                key={tab} 
                className={`py-3 px-4 font-semibold text-[15px] whitespace-nowrap transition-colors rounded-lg ${idx === 0 ? 'text-primary bg-primary/10' : 'text-foreground/60 hover:bg-hover hover:text-foreground'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[3fr_4fr] xl:grid-cols-[4fr_5.5fr] gap-4">
        {/* Left Column: Intro */}
        <div className="space-y-4">
          <div className="bg-card p-4 rounded-lg shadow-sm border border-border/50">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-[20px] text-foreground">Thông tin cá nhân</h2>
              <span className="text-xs text-foreground/50">Dữ liệu backend</span>
            </div>
            <div className="space-y-4">
              {profile.bio && (
                <div className="text-[15px] text-foreground/80 whitespace-pre-line">{profile.bio}</div>
              )}
              {profile.studentId && (
                <div className="flex items-center gap-3 text-foreground/80">
                  <Medal className="w-6 h-6 text-foreground/40 shrink-0" />
                  <span className="text-[15px]">Mã sinh viên <span className="font-semibold text-foreground">{profile.studentId}</span></span>
                </div>
              )}
              {profile.major && (
                <div className="flex items-center gap-3 text-foreground/80">
                  <GraduationCap className="w-6 h-6 text-foreground/40 shrink-0" />
                  <span className="text-[15px]">Ngành <span className="font-semibold text-foreground">{profile.major}</span></span>
                </div>
              )}
              {profile.cohort && (
                <div className="flex items-center gap-3 text-foreground/80">
                  <Calendar className="w-6 h-6 text-foreground/40 shrink-0" />
                  <span className="text-[15px]">Khóa <span className="font-semibold text-foreground">{profile.cohort}</span></span>
                </div>
              )}
              {profile.address ? (
                <div className="flex items-center gap-3 text-foreground/80">
                  <MapPin className="w-6 h-6 text-foreground/40 shrink-0" />
                  <span className="text-[15px]">Sống ở <span className="font-semibold text-foreground">{profile.address}</span></span>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-foreground/50">
                  <MapPin className="w-6 h-6 text-foreground/30 shrink-0" />
                  <span className="text-[15px]">Chưa cập nhật nơi sống</span>
                </div>
              )}
              
              {profile.hometown ? (
                <div className="flex items-center gap-3 text-foreground/80">
                  <Home className="w-6 h-6 text-foreground/40 shrink-0" />
                  <span className="text-[15px]">Từ <span className="font-semibold text-foreground">{profile.hometown}</span></span>
                </div>
              ) : null}

              {profile.birthDate ? (
                <div className="flex items-center gap-3 text-foreground/80">
                  <Cake className="w-6 h-6 text-foreground/40 shrink-0" />
                  <span className="text-[15px]">{profile.birthDate}</span>
                </div>
              ) : null}
            </div>
          </div>

          <div className="bg-card p-4 rounded-lg shadow-sm border border-border/50">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-[20px] text-foreground">Công việc</h2>
            </div>
            
            {profile.workExperience && profile.workExperience.length > 0 ? (
              <div className="space-y-4">
                {profile.workExperience.map((work: any, i: number) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xl shrink-0">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-semibold text-[15px] text-foreground block">{work.company}</span>
                      <span className="text-[13px] text-foreground/60">{work.duration || 'Đang làm việc tại đây'}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-foreground/50 text-[15px]">Chưa có thông tin công việc.</p>
            )}
          </div>

          <div className="bg-card p-4 rounded-lg shadow-sm border border-border/50">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-[20px] text-foreground">Giáo dục</h2>
              <span className="text-xs text-foreground/50">Khóa/ngành lấy từ backend</span>
            </div>
            {profile.education && profile.education.length > 0 ? (
              <div className="space-y-4">
                {profile.education.map((edu: any, i: number) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-hover flex items-center justify-center text-foreground/60 shrink-0">
                      <GraduationCap className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="font-semibold text-[15px] text-foreground block">{edu.school}</span>
                      <span className="text-[13px] text-foreground/60">{edu.department}</span>
                      {edu.studentId && <span className="block text-[13px] text-foreground/50">MSSV: {edu.studentId}</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-foreground/50 text-[15px]">Chưa có thông tin giáo dục.</p>
            )}
          </div>
        </div>

        {/* Right Column: Timeline / Posts */}
        <div className="space-y-4">
          {/* Create Post Form */}
          {isOwner && (
            <CreatePost />
          )}

          {/* Posts Filter Header */}
          <div className="bg-card rounded-lg shadow-sm border border-border/50 overflow-hidden">
            <div className="p-4 flex justify-between items-center border-b border-border/50">
              <h2 className="font-bold text-[20px] text-foreground">Bài viết</h2>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 bg-hover hover:bg-foreground/10 rounded-md font-semibold text-[15px] text-foreground flex items-center gap-2 transition-colors">
                  <SlidersHorizontal className="w-4 h-4" /> Bộ lọc
                </button>
                <button className="px-3 py-1.5 bg-hover hover:bg-foreground/10 rounded-md font-semibold text-[15px] text-foreground flex items-center gap-2 transition-colors">
                  <Settings2 className="w-4 h-4" /> Quản lý bài viết
                </button>
              </div>
            </div>
            
            <div className="flex">
              <button className="flex-1 py-3 flex items-center justify-center gap-2 text-primary border-b-[3px] border-primary font-semibold text-[15px]">
                <List className="w-5 h-5" /> Chế độ xem danh sách
              </button>
              <button className="flex-1 py-3 flex items-center justify-center gap-2 text-foreground/60 hover:bg-hover transition-colors font-semibold text-[15px]">
                <Grid className="w-5 h-5" /> Chế độ xem lưới
              </button>
            </div>
          </div>
          
          {profilePosts.length > 0 ? (
            <div className="space-y-4">
              {profilePosts.map(post => <PostCard key={post.id} post={post} onDeleted={() => setProfilePosts(prev => prev.filter(p => p.id !== post.id))} />)}
            </div>
          ) : (
            <div className="bg-card p-10 rounded-lg shadow-sm border border-border/50 flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-hover flex items-center justify-center mb-4">
                <ImageIcon className="w-8 h-8 text-foreground/40" />
              </div>
              <h3 className="font-bold text-[18px] text-foreground mb-1">Chưa có bài viết nào</h3>
              <p className="text-[15px] text-foreground/60">Bài viết thật từ backend sẽ hiển thị ở đây.</p>
            </div>
          )}
        </div>
      </div>

      {editOpen && isOwner && profile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-xl rounded-2xl bg-card border border-border shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
              <h2 className="font-bold text-xl text-foreground">Chỉnh sửa hồ sơ</h2>
              <button
                onClick={() => setEditOpen(false)}
                className="w-9 h-9 rounded-full hover:bg-hover flex items-center justify-center"
                disabled={savingProfile}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1">Họ tên</label>
                <input
                  value={editForm.fullName}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, fullName: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                  maxLength={120}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-1">Tiểu sử</label>
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, bio: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground outline-none focus:ring-2 focus:ring-primary/30 min-h-[110px] resize-none"
                  maxLength={500}
                  placeholder="Viết vài dòng về bạn"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-1">Nơi sống</label>
                <input
                  value={editForm.location}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                  maxLength={120}
                  placeholder="Ví dụ: Hà Nội"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-1">Khoa/đơn vị</label>
                <input
                  value={editForm.department}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, department: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                  maxLength={120}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1">Ngành</label>
                  <input
                    value={profile.major || 'Chưa cập nhật'}
                    disabled
                    className="w-full px-3 py-2 rounded-lg border border-border bg-hover text-foreground/60 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1">Khóa</label>
                  <input
                    value={profile.cohort || 'Chưa cập nhật'}
                    disabled
                    className="w-full px-3 py-2 rounded-lg border border-border bg-hover text-foreground/60 cursor-not-allowed"
                  />
                </div>
              </div>

              <p className="text-sm text-foreground/60">Ngành và khóa lấy từ hệ thống, không thể sửa trên trang cá nhân.</p>
            </div>

            <div className="px-5 py-4 border-t border-border/60 flex justify-end gap-3">
              <button
                onClick={() => setEditOpen(false)}
                disabled={savingProfile}
                className="px-4 py-2 rounded-lg bg-hover hover:bg-foreground/10 font-semibold text-foreground disabled:opacity-60"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={savingProfile || !editForm.fullName.trim()}
                className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white font-semibold flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Cropper Modal */}
      {cropImageSrc && cropType === 'avatar' && (
        <ImageCropper
          imageSrc={cropImageSrc}
          onClose={() => { setCropImageSrc(null); setCropType(null); }}
          onCropComplete={(croppedFile) => {
            setCropImageSrc(null);
            setCropType(null);
            uploadImage(croppedFile, 'avatar');
          }}
          aspectRatio={1}
          isCircular={true}
        />
      )}
    </div>
  );
}
