import dynamic from 'next/dynamic';
import Header from './components/Header';

// Use dynamic import for the client component
const LandingPage = dynamic(() => import('./components/LandingPage'), {
  ssr: true
});

export default function Home() {
  return (
    <main>
      <Header />
      <LandingPage />
    </main>
  );
} 