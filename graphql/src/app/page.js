'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/profile');
    } else {
      router.push('/auth');
    }
  }, [router]);

  return <div>Loading...</div>;
}
