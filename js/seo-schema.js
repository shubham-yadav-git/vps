// SEO Schema and Structured Data
const seoSchemas = {
  educational: {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "name": "Vikas Public School",
    "alternateName": "VPS",
    "description": "Premier educational institution offering quality education since 2006. Nurturing young minds through holistic development and innovative teaching methods.",
    "url": "https://vikaspublicschool.edu",
    "logo": "https://vikaspublicschool.edu/assets/logo.png",
    "image": "https://vikaspublicschool.edu/assets/school.jpg",
    "foundingDate": "2006",
    "founder": {
      "@type": "Person",
      "name": "Jatashankar Pal"
    },
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Your School Address",
      "addressLocality": "Your City",
      "addressRegion": "Your State",
      "postalCode": "Your PIN",
      "addressCountry": "IN"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+91-XXXXXXXXXX",
      "contactType": "Admissions",
      "availableLanguage": ["English", "Hindi"]
    },
    "sameAs": [
      "https://www.facebook.com/vikaspublicschool",
      "https://www.instagram.com/vikaspublicschool",
      "https://www.youtube.com/vikaspublicschool"
    ],
    "subOrganization": [
      {
        "@type": "EducationalOrganization",
        "name": "Primary Section",
        "description": "Classes 1-5"
      },
      {
        "@type": "EducationalOrganization", 
        "name": "Secondary Section",
        "description": "Classes 6-12"
      }
    ],
    "hasCredential": {
      "@type": "EducationalOccupationalCredential",
      "credentialCategory": "CBSE Affiliation"
    }
  },

  website: {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Vikas Public School",
    "url": "https://vikaspublicschool.edu",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://vikaspublicschool.edu/?s={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  },

  organization: {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Vikas Public School",
    "url": "https://vikaspublicschool.edu",
    "logo": "https://vikaspublicschool.edu/assets/logo.png",
    "slogan": "Excellence in Education",
    "description": "Vikas Public School - Empowering Future Leaders through Quality Education",
    "foundingDate": "2006",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Your School Address",
      "addressLocality": "Your City", 
      "addressRegion": "Your State",
      "postalCode": "Your PIN",
      "addressCountry": "IN"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+91-XXXXXXXXXX",
      "contactType": "customer service"
    }
  },

  faq: {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is the admission process for Vikas Public School?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "The admission process involves filling out an application form, document verification, and an interaction session. Visit our admissions section for detailed information."
        }
      },
      {
        "@type": "Question", 
        "name": "What curriculum does Vikas Public School follow?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Vikas Public School follows the CBSE curriculum with a focus on holistic development including academics, sports, and co-curricular activities."
        }
      }
    ]
  }
};

// Function to inject schemas into page
function injectSchemas() {
  Object.keys(seoSchemas).forEach(key => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(seoSchemas[key]);
    document.head.appendChild(script);
  });
}

// Initialize schemas when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectSchemas);
} else {
  injectSchemas();
}