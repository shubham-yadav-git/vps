# Vikas Public School Website

A modern, responsive website for Vikas Public School featuring dynamic content management and Firebase integration.

## Features

- 🎨 **Modern Design**: Clean, responsive design with smooth animations
- 📱 **Mobile Responsive**: Optimized for all device sizes
- 🔥 **Firebase Integration**: Content stored in Cloud Firestore
- 👨‍💼 **Admin Panel**: Complete content management system
- 🖼️ **Dynamic Content**: Faculty, gallery, testimonials, events, and FAQ management
- ♿ **Accessibility**: WCAG compliant with proper ARIA labels
- ⚡ **Performance**: Smart caching and optimized loading

## Project Structure

```
vps/
├── web/                     # The website (React + Vite + Tailwind)
│   ├── index.html           # Homepage (prerendered at build time)
│   ├── mandatory-public-disclosure.html
│   ├── admin.html           # Admin panel (client-only)
│   ├── src/
│   │   ├── components/      # Public page sections
│   │   ├── pages/           # Home and Disclosure pages
│   │   ├── admin/           # Admin panel: editors, auth, Firestore writes
│   │   ├── lib/             # Firebase, content loading/caching, helpers
│   │   └── data/defaults.js # Fallback content rendered into the HTML
│   ├── public/              # Copied as-is: icons, logo, 404, robots, sitemap, assets/
│   ├── brand/               # Full-size logo source (not deployed)
│   └── scripts/prerender.js
├── firestore.rules          # Firestore security rules
├── firebase.json            # Firebase CLI config (rules deployment)
└── .github/workflows/       # Build and deploy to GitHub Pages
```

`web/public/assets/` holds the photos the database still points to (two leadership photos and three gallery photos) and the printable admission form.

## Development

```bash
cd web
npm install
npm run dev        # http://localhost:5173  (admin at /admin.html)
npm run build      # production build in web/dist
```

`npm run dev` talks to the **live** database. To test admin changes safely, run the
Firebase emulators and start Vite with `VITE_FIREBASE_EMULATOR=1`:

```bash
firebase emulators:start --only firestore,auth   # Firestore on 8085, Auth on 9099
VITE_FIREBASE_EMULATOR=1 npm run dev
```

The admin shows a "Test database" badge when it is using the emulators.

## Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/shubham-yadav-git/vps.git
   cd vps
   ```

2. **Configure Firebase**
   - The Firebase web config lives in `js/firebase-config.js` and `admin.html`
   - These keys are public by design; access is controlled by `firestore.rules`

3. **Set up the admin account** (Firebase Console → Authentication)
   - Create a user with the email `admin@vikaspublicschool.in`. This owner account is always an administrator.
   - Add other staff from the admin panel's **Staff accounts** page (see below).
   - Under **Settings → User actions**, keep **Enable create (sign-up)** on so new staff can set their own password.
     This is safe: an account can only change anything once its email is on the staff list *and* verified.
     If you prefer to keep sign-up off, create each staff member's account yourself in Authentication → Users.

4. **Deploy the Firestore rules**
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase deploy --only firestore:rules
   ```
   Or paste `firestore.rules` into Firebase Console → Firestore Database → Rules → **Publish**.
   The rules only take effect once published.

5. **Deploy**
   - Push to `main`; GitHub Actions builds `web/` and publishes it to vikaspublicschool.in

## Security

- Anyone can **read** the website content (`faculty`, `gallery`, `testimonials`, `events`, `faq`, `calendar`, `achievements`, `downloads`, `settings`, `cache`, `disclosure_rows`)
- **Editors** can change website content and work through enquiries
- **Administrators** can also change contact details, logo, Site & SEO, the mandatory disclosure, staff accounts, and read the activity log
- The public site's only write is **creating an enquiry** from the contact form; the rules check every field, and visitors can't read, change or delete enquiries
- The **activity log** is append-only: entries can't be edited or deleted, and each one is tied to the signed-in account
- Rules are covered by tests: `cd web && npm run test:rules` (runs the Firestore emulator)

## Admin Panel Features

Sign in at `/admin.html` with the admin account. Every page saves explicitly and warns before you leave with unsaved changes.

- **Dashboard**: New enquiries, active notices, upcoming dates, popup status, things that need attention, recent activity
- **Enquiries**: Messages from the website's contact form; call/WhatsApp links, status (New → Contacted → Visited → Admitted/Closed), follow-up notes, CSV export
- **Notice Board**: Post notices with a "show until" date; export and import as JSON
- **Calendar**: Events, exams, holidays and meetings in a month view; upcoming dates appear on the website
- **Popup & banner**: Schedule a homepage announcement with start and end dates and a live preview
- **Achievements**: Board results, toppers and awards, with photos, in a drag-to-reorder list
- **Gallery**: Upload several photos at once (compressed automatically), add captions
- **Downloads**: Fee structure, syllabus, forms and circulars (PDF/image up to ~900 KB, or a Google Drive link)
- **Faculty, Testimonials, FAQ**: Drag to set the order shown on the website
- **Mandatory Disclosure**: Edit sections, columns and rows; attach PDFs or link Google Drive files
- **Homepage, contact, logo, school info**: Banner, about, academics and contact details
- **Site & SEO**: Social links, WhatsApp, Google Maps link, search title and description (baked into the HTML by the nightly rebuild)
- **Staff accounts**: Give each person their own sign-in as an Editor or Administrator; suspend or remove access
- **Activity log**: Who changed what, and when

Press **Ctrl K** (⌘K on Mac) anywhere in the panel to jump to a section.

## Content Management

All content is stored in Firebase Firestore and loaded dynamically with smart caching for optimal performance. Changes made in the admin panel appear immediately on the main website.

## Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Firebase Firestore
- **Storage**: Images and documents stored in Firestore (base64)
- **Styling**: Custom CSS with Flexbox and Grid
- **Icons**: Unicode emojis and CSS icons

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support or questions, please contact the development team.
