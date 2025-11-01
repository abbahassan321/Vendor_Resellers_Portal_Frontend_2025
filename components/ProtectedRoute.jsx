'use client';
import { useAuth } from './AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, authReady } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authReady && !isAuthenticated) {
      router.push('/'); // redirect only when ready
    }
  }, [authReady, isAuthenticated, router]);

  if (!authReady) return <div>Loading...</div>; // ✅ wait until we know auth state

  return isAuthenticated ? children : null;
}
