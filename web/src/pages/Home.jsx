import { useState } from 'react';
import About from '../components/About';
import Academics from '../components/Academics';
import Admissions from '../components/Admissions';
import BackToTop from '../components/BackToTop';
import Contact from '../components/Contact';
import Faculty from '../components/Faculty';
import Faq from '../components/Faq';
import Footer from '../components/Footer';
import Gallery from '../components/Gallery';
import Header from '../components/Header';
import Hero from '../components/Hero';
import NoticeBoard from '../components/NoticeBoard';
import NoticeDrawer from '../components/NoticeDrawer';
import Testimonials from '../components/Testimonials';
import { SiteContentProvider } from '../lib/SiteContent';

export default function Home() {
  const [noticesOpen, setNoticesOpen] = useState(false);

  return (
    <SiteContentProvider>
      <a href="#main" className="sr-only z-50 rounded-full bg-brand-600 px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
        Skip to content
      </a>
      <Header onOpenNotices={() => setNoticesOpen(true)} />
      <main id="main">
        <Hero />
        <About />
        <Academics />
        <Faculty />
        <NoticeBoard />
        <Gallery />
        <Testimonials />
        <Admissions />
        <Faq />
        <Contact />
      </main>
      <Footer />
      <NoticeDrawer open={noticesOpen} onClose={() => setNoticesOpen(false)} />
      <BackToTop />
    </SiteContentProvider>
  );
}
