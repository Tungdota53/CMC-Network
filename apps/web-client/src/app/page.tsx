import { redirect } from 'next/navigation';

export default function HomePage() {
  // Tạm thời redirect thẳng vào feed (hoặc login nếu auth guard check)
  redirect('/feed');
}
