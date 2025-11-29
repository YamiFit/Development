# YamiFit - Your Personal Wellness Journey

A modern, responsive landing page for YamiFit, a comprehensive wellness and nutrition tracking application built with React, Vite, and Tailwind CSS.

## 🚀 Features

- **Calorie Tracking** - Monitor daily intake with precision
- **AI-Powered Meal Planning** - Personalized meal recommendations
- **Diet Plans** - Customized nutrition plans for your goals
- **Expert Coaching** - Connect with certified nutritionists
- **Progress Analytics** - Track your wellness journey
- **Responsive Design** - Optimized for all devices

## 🛠️ Tech Stack

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Redux Toolkit** - State management
- **React Router** - Client-side routing
- **Lucide React** - Icon library
- **Shadcn/ui** - UI component library

## 📦 Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📁 Project Structure

```
YamiFit/
├── src/
│   ├── components/
│   │   ├── First/          # Landing page components
│   │   │   ├── Navbar.jsx
│   │   │   ├── Hero.jsx
│   │   │   ├── Features.jsx
│   │   │   ├── HowItWorks.jsx
│   │   │   ├── Testimonials.jsx
│   │   │   ├── Pricing.jsx
│   │   │   ├── FAQ.jsx
│   │   │   ├── CTA.jsx
│   │   │   ├── Footer.jsx
│   │   │   └── ScrollToTop.jsx
│   │   ├── ui/             # Reusable UI components
│   │   └── store/          # Redux store configuration
│   ├── data/               # Static data and content
│   │   ├── faqData.js
│   │   ├── featuresData.jsx
│   │   ├── howItWorks.jsx
│   │   ├── pricingData.js
│   │   └── testimonials.js
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility libraries
│   ├── pages/              # Page components
│   │   ├── Index.jsx
│   │   └── NotFound.jsx
│   ├── utils/              # Helper functions
│   ├── App.jsx             # Root component
│   ├── main.jsx            # Entry point
│   └── index.css           # Global styles
├── public/                 # Static assets
├── package.json
├── vite.config.js
└── tailwind.config.js
```

## 🎨 Customization

### Colors
The app uses custom Tailwind colors defined in `tailwind.config.js`:
- `yamifit-primary` - Main brand color (#3BB273)
- `yamifit-secondary` - Secondary brand color (#FF6B6B)
- `yamifit-accent` - Accent color for text
- `yamifit-light` - Light background

### Content
Update content by editing files in the `src/data/` directory:
- `faqData.js` - FAQ questions and answers
- `featuresData.jsx` - Feature descriptions
- `howItWorks.jsx` - Process steps
- `pricingData.js` - Pricing plans
- `testimonials.js` - User testimonials

## 🌐 Deployment

### Build for Production
```bash
npm run build
```

The build output will be in the `dist/` folder, ready to deploy to any static hosting service.

## 📝 Code Quality Best Practices

This project follows these standards:
- ✅ Consistent component structure
- ✅ Organized file naming conventions
- ✅ Separated data from components
- ✅ Reusable UI components
- ✅ Custom hooks for shared logic
- ✅ Clean imports using path aliases (@/)
- ✅ ESLint configuration for code quality

## 🚀 Performance

- Code splitting with React.lazy()
- Optimized images with proper sizing
- Tailwind CSS purging for smaller bundle
- Vite's fast HMR for development

## 📄 License

This project is licensed under the MIT License.

## 👥 Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

Built with ❤️ for healthy living

