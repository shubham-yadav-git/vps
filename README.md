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

The live site is the React app in `web/`. GitHub Actions builds it and deploys `web/dist`.

```
vps/
├── web/                    # React + Vite + Tailwind site (what gets deployed)
│   ├── index.html          # Homepage (prerendered at build time)
│   ├── mandatory-public-disclosure.html
│   ├── admin.html          # Admin panel (React, client-only)
│   └── src/
│       ├── components/     # Public page sections
│       ├── pages/          # Home and Disclosure pages
│       ├── admin/          # Admin panel: editors, auth, Firestore writes
│       ├── lib/            # Firebase, content loading/caching, helpers
│       └── data/defaults.js # Fallback content rendered into the HTML
├── assets/                 # Images and the admission form (copied into the build)
├── firestore.rules         # Firestore security rules
├── firebase.json           # Firebase CLI config (rules deployment)
└── .github/workflows/      # Build and deploy to GitHub Pages
```

Root-level `index.html`, `admin.html`, `js/` and `css/` are the previous static site. They are no longer deployed.

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
   - Create a user with the email `admin@vikaspublicschool.in`
   - Under **Settings → User actions**, turn off **Enable create (sign-up)** so nobody else can register
   - To add another admin, add their email to `isAdmin()` in `firestore.rules`

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

- Anyone can **read** the website content collections (`faculty`, `gallery`, `testimonials`, `events`, `faq`, `settings`, `cache`, `disclosure_rows`)
- Only the signed-in admin account can **write** to them
- The public site never writes to Firestore

## Admin Panel Features

Sign in at `/admin.html` with the admin account. Every page saves explicitly and warns before you leave with unsaved changes.

- **Dashboard**: Counts, expired notices, duplicate or uncaptioned photos
- **Faculty Management**: Add, edit, delete faculty members with photos
- **Gallery Management**: Upload several photos at once (compressed automatically), add captions
- **Testimonials**: Manage student and parent testimonials
- **Notice Board**: Post notices with a "show until" date; export and import as JSON
- **FAQ Management**: Add and organize frequently asked questions
- **Mandatory Disclosure**: Edit sections, columns and rows; attach PDFs or link Google Drive files
- **Settings**: Update hero banner, about section, academics, logo, school info, contact details

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
