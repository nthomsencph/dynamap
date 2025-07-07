'use client';
import dynamic from 'next/dynamic';

const Map = dynamic(() => import('./components/map/Map'), { ssr: false });

export default function Home() {
  return (
    <div className="relative h-screen w-screen text-white">
      <Map />
    </div>
  );
}
