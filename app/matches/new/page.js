'use client';
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

function NewMatchRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tournamentId = searchParams.get('tournamentId');
  
  useEffect(() => {
    router.replace(`/matches?new=1${tournamentId ? `&tournamentId=${tournamentId}` : ''}`);
  }, []);

  return null;
}

export default function NewMatchPage() {
  return (
    <Suspense fallback={null}>
      <NewMatchRedirect />
    </Suspense>
  );
}
