'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import WatchLaterDashboard from '@/components/WatchLaterDashboard';

export default function SaveLaterPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/saves');
  }, [router]);

  return <WatchLaterDashboard activePage="saves" />;
}
