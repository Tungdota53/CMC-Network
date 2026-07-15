import { redirect } from 'next/navigation';

// This page redirects to the main messages layout
// The actual chat is at /messages/t/[id]
export default function ConversationPage({ params }: { params: { conversationId: string } }) {
  redirect(`/messages/t/${params.conversationId}`);
}
