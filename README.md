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
├── index.html              # Main website
├── mandatory-public-disclosure.html  # CBSE mandatory public disclosure page
├── admin.html              # Admin panel for content management
├── assets/                 # Images, documents, and static files
├── css/                    # Stylesheets
│   └── style.css          # Main stylesheet
├── js/                     # JavaScript files
│   ├── main.js            # Navigation, notices, gallery, forms
│   ├── firebase-config.js # Firebase setup and content loading
│   └── content-updaters.js # Renders Firestore content into the page
├── firestore.rules        # Firestore security rules
├── firebase.json          # Firebase CLI config (rules deployment)
└── .firebaserc            # Firebase project ID
```

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

5. **Open the website**
   - Open `index.html` in a web browser for the main website
   - Open `admin.html` for the admin panel

## Security

- Anyone can **read** the website content collections (`faculty`, `gallery`, `testimonials`, `events`, `faq`, `settings`, `cache`, `disclosure_rows`)
- Only the signed-in admin account can **write** to them
- The public site never writes to Firestore

## Admin Panel Features

- **Faculty Management**: Add, edit, delete faculty members with photos
- **Gallery Management**: Upload and organize gallery images
- **Testimonials**: Manage student and parent testimonials
- **Events**: Create and manage school events
- **FAQ Management**: Add and organize frequently asked questions
- **Settings**: Update hero section, about section, academics, contact info

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
