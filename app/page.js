// File: app/page.js
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Immediately redirect to /admin/cms
    router.replace('/admin/cms');
  }, [router]);

  // You can return null (nothing) because the redirect happens on mount.
  return null;
}
