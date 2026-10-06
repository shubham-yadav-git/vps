// Default content, taken from the live Firestore data (images excluded).
// It is rendered into the HTML at build time so the site works and is indexable
// before Firestore loads, and if Firestore is unreachable.

export const DEFAULT_CONTENT = {
  hero: {
    title: 'Excellence in Education',
    subtitle: 'Empowering the Future Leaders',
    backgroundImage: '',
  },
  logo: {
    logoUrl: '/logo.png',
    schoolName: 'Vikas Public School',
    tagline: 'Excellence in Education',
  },
  about: {
    content:
      'Vikas Public School, established in 2004, is committed to nurturing young minds through holistic education. Our mission is to foster intellectual curiosity, critical thinking, and responsible citizenship through a dynamic curriculum and dedicated faculty.',
    leadership: [
      {
        id: 'manager',
        name: 'Jatashankar Pal',
        position: 'Manager',
        description: 'Leading the institution with vision and dedication to excellence in education.',
        image: '/assets/IMG-20250726-WA0016.jpg',
      },
      {
        id: 'principal',
        name: 'Chandrabhushan Yadav',
        position: 'Principal',
        description: 'Committed to fostering academic excellence and character development.',
        image: '/assets/IMG-20250726-WA0017.jpg',
      },
    ],
    highlights: [
      { id: 'academics', icon: '📚', title: 'Strong Academics', description: 'A structured curriculum with regular assessment and support' },
      { id: 'campus', icon: '🏫', title: 'Modern Campus', description: 'Smart classrooms, libraries, science labs, and sports facilities' },
      { id: 'development', icon: '🎯', title: 'Holistic Development', description: 'Focus on academics, co-curricular activities, and personal growth' },
      { id: 'environment', icon: '🛡️', title: 'Safe Environment', description: 'Inclusive and secure learning atmosphere for all students' },
    ],
  },
  academics: {
    description:
      'At Vikas Public School, we offer a comprehensive curriculum that nurtures academic excellence and critical thinking skills.',
    curriculum: 'CBSE syllabus from Nursery to Class X.',
    programs: 'STEM initiatives, Coding clubs, Language enrichment.',
    assessment: 'Continuous Evaluation, Project Based Learning, Olympiads preparation.',
    extracurricular: 'Art, Music, Dance, Debate, and Sports to nurture talents.',
  },
  contact: {
    address: 'Bairangiya, Newada, Jaunpur, Uttar Pradesh, 222146, India.',
    phone: '9559657249, 7275629236, 8896882133',
    email: 'vikaspublicschool08@gmail.com',
    hours: '8 AM – 3 PM',
  },
  faculty: [
    { id: 'f1', name: 'Ajay Kumar Yadav', role: 'Head of Maths', description: '10 years of teaching experience and passion for student mentoring.', photo: '' },
    { id: 'f2', name: 'Sanoj Kumar', role: 'Math', description: '6 years of teaching experience and passion for student mentoring.', photo: '' },
    { id: 'f3', name: 'Rakesh Yadav', role: 'Head of Bio', description: '5 years teaching experience.', photo: '' },
  ],
  testimonials: [
    { id: 't1', name: 'Anil Yadav', role: 'Parent', text: "Vikas Public School has transformed my child's life with excellent academics and a nurturing environment." },
    { id: 't2', name: 'Prakhar Saroj', role: 'Student', text: 'The teachers here are supportive and the activities are fun and enriching. I love being part of the school.' },
    { id: 't3', name: 'Meera Singh', role: 'Student', text: 'The teachers here are supportive and the activities are fun and enriching. I love being part of the school.' },
  ],
  gallery: [
    { id: 'g1', src: '/assets/gallery7.jpg', alt: 'Science experiments in the school lab' },
    { id: 'g2', src: '/assets/gallery8.jpg', alt: 'School activity or event' },
    { id: 'g3', src: '/assets/gallery9.jpg', alt: 'Principal' },
  ],
  faq: [
    { id: 'faq1', question: 'What is the admission process?', answer: 'We have an application followed by an entrance test and interview. Detailed steps are available in the Admissions section.' },
    { id: 'faq2', question: 'Do you offer transportation facilities?', answer: 'Yes, we provide safe and reliable transport services covering major areas of the region.' },
    { id: 'faq3', question: 'What co-curricular activities are available?', answer: 'Students can participate in sports, music, dance, arts, debate, coding clubs, and more.' },
  ],
  // Notices are date-sensitive, so they are only shown once loaded in the browser
  events: [],
};
