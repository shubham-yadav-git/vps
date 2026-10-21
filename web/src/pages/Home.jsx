import { useEffect, useState } from 'react';
import About from '../components/About';
import Achievements from '../components/Achievements';
import Announcement from '../components/Announcement';
import Academics from '../components/Academics';
import Admissions from '../components/Admissions';
import BackToTop from '../components/BackToTop';
import Calendar from '../components/Calendar';
import Contact from '../components/Contact';
import Downloads from '../components/Downloads';
import Faculty from '../components/Faculty';
import Faq from '../components/Faq';
import Footer from '../components/Footer';
import Gallery from '../components/Gallery';
import Header from '../components/Header';
import Hero from '../components/Hero';
import NoticeBoard from '../components/NoticeBoard';
import NoticeDrawer from '../components/NoticeDrawer';
import Testimonials from '../components/Testimonials';
import { SiteContentProvider, useSiteContent } from '../lib/SiteContent';

/** Applies the Site & SEO title and description once loaded (the build also bakes them into the HTML). */
function PageMeta() {
  const { content } = useSiteContent();
  const { seoTitle, seoDescription } = content.site || {};
  useEffect(() => {
    if (seoTitle) document.title = seoTitle;
    if (seoDescription) document.querySelector('meta[name="description"]')?.setAttribute('content', seoDescription);
  }, [seoTitle, seoDescription]);
  return null;
}

export default function Home() {
  const [noticesOpen, setNoticesOpen] = useState(false);

  return (
    <SiteContentProvider>
      <a href="#main" className="sr-only z-50 rounded-full bg-brand-600 px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
        Skip to content
      </a>
      <Header onOpenNotices={() => setNoticesOpen(true)} />
      <main id="main">
        <Announcement />
        <Hero />
        <About />
        <Academics />
        <Achievements />
        <Faculty />
        <NoticeBoard />
        <Calendar />
        <Gallery />
        <Testimonials />
        <Admissions />
        <Downloads />
        <Faq />
        <Contact />
      </main>
      <PageMeta />
      <Footer />
      <NoticeDrawer open={noticesOpen} onClose={() => setNoticesOpen(false)} />
      <BackToTop />
    </SiteContentProvider>
  );
}
