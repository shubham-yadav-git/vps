# Vikas Public School Website

A modern, responsive website for Vikas Public School featuring dynamic content management and Firebase integration.

## Features

- 🎨 **Modern Design**: Clean, responsive design with smooth animations
- 📱 **Mobile Responsive**: Optimized for all device sizes
- 🔥 **Firebase Integration**: Real-time database with cloud storage
- 👨‍💼 **Admin Panel**: Complete content management system
- 🖼️ **Dynamic Content**: Faculty, gallery, testimonials, events, and FAQ management
- 🤖 **AI Chatbot**: Intelligent assistant powered by Google Gemini API for student queries
- ♿ **Accessibility**: WCAG compliant with proper ARIA labels
- ⚡ **Performance**: Smart caching and optimized loading

## Project Structure

```
vps/
├── index.html              # Main website
├── admin.html              # Admin panel for content management
├── assets/                 # Images, documents, and static files
├── css/                    # Stylesheets
│   ├── style.css          # Main stylesheet
│   └── chatbot.css        # Chatbot styling
├── js/                     # JavaScript files
│   ├── main.js            # Main JavaScript functionality
│   └── chatbot.js         # AI chatbot functionality
├── firestore.rules        # Firebase security rules
├── FIREBASE-SETUP.md      # Firebase configuration guide
└── SECURITY.md            # Security documentation
```

## Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/shubham-yadav-git/vps.git
   cd vps
   ```

2. **Configure Firebase**
   - Follow the instructions in `FIREBASE-SETUP.md`
   - Update Firebase configuration in both `index.html` and `admin.html`

3. **Configure Chatbot (Optional)**
   - Get a Google Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Replace the API key in `js/chatbot.js` (line 3)
   - The chatbot provides intelligent responses about school information

4. **Deploy Firebase Rules**
   ```bash
   firebase deploy --only firestore:rules
   ```

5. **Open the website**
   - Open `index.html` in a web browser for the main website
   - Open `admin.html` for the admin panel

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
- **AI Integration**: Google Gemini API for intelligent chatbot
- **Storage**: Firebase Storage (for images)
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
