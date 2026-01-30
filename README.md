# 🔍 OSINT Detective Corkboard

A production-ready, desktop-first web app for visualizing OSINT intelligence on an interactive detective corkboard.

## Features

✅ **Interactive Canvas**
- Drag, pan, and zoom canvas
- Visual boundary with upgrade prompts
- Minimap for navigation

✅ **5 Node Types**
- 📝 Text Notes (rich text)
- 🔗 Link Cards (with URL previews)
- 🖼️ Image Cards (drag & drop images)
- 👤 People/Alias Cards
- 📍 Location Cards

✅ **String Connections**
- Connect any nodes with labeled wires
- Animated string effects
- Visual relationship mapping

✅ **Persistent Storage**
- All data saved in browser localStorage
- Auto-save on every change
- Never lose your work

✅ **Professional Features**
- Undo/Redo support
- Context menu (right-click)
- Drag & drop file support
- Realistic corkboard design

## 📁 Project Structure

```
osint-corkboard/
├── public/
│   └── index.html          # Main HTML file
├── src/
│   ├── App.jsx            # Main React component
│   ├── App.css            # Styling with corkboard theme
│   ├── index.js           # React entry point
│   └── index.css          # Global styles
├── package.json           # Dependencies
├── .gitignore            # Git ignore rules
└── README.md             # This file
```

## 🚀 Deployment Instructions

### Step 1: Create GitHub Repository

1. Go to [GitHub](https://github.com) and create a new repository
2. Name it `osint-corkboard` (or whatever you prefer)
3. **Do NOT initialize with README** (we already have files)

### Step 2: Upload Files to GitHub

You have two options:

#### Option A: Using GitHub Web Interface (Easiest for beginners)

1. In your new repository, click **"uploading an existing file"**
2. Drag and drop ALL the files from the project structure above
3. Commit the changes

#### Option B: Using Git Command Line

```bash
# Navigate to the project folder on your computer
cd osint-corkboard

# Initialize git
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit"

# Add remote (replace YOUR-USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR-USERNAME/osint-corkboard.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Step 3: Deploy to Vercel

1. Go to [Vercel](https://vercel.com) and sign up/login
2. Click **"Add New Project"**
3. Import your GitHub repository (`osint-corkboard`)
4. Vercel will auto-detect it's a React app
5. **Framework Preset**: Should auto-select "Create React App"
6. **Build Command**: `npm run build` (default)
7. **Output Directory**: `build` (default)
8. Click **"Deploy"**

That's it! Vercel will build and deploy your app in ~2 minutes.

## 🎯 File Placement Guide

When uploading to GitHub, maintain this exact structure:

```
Repository Root/
├── public/
│   └── index.html
├── src/
│   ├── App.jsx
│   ├── App.css
│   ├── index.js
│   └── index.css
├── package.json
├── .gitignore
└── README.md
```

## 🛠️ Local Development (Optional)

If you want to run locally before deploying:

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

## 📝 Usage Guide

### Adding Nodes
- **Right-click** on canvas → Select node type
- **Drag** nodes to reposition
- **Click** title to edit

### Creating Connections
- Click the **🔗 button** on a node
- Click another node to create connection
- Edit label by updating connection

### Navigation
- **Scroll** to zoom in/out
- **Click and drag** canvas to pan
- Use **minimap** for overview

### Keyboard Shortcuts
- `Ctrl/Cmd + Z` - Undo
- `Ctrl/Cmd + Shift + Z` or `Ctrl/Cmd + Y` - Redo

## 🎨 Customization

### Change Canvas Size
In `src/App.jsx`, line 7:
```javascript
const CANVAS_BOUNDS = { width: 4000, height: 3000 };
```

### Modify Colors
Edit the color values in `src/App.css`

## 🔧 Troubleshooting

**Build fails on Vercel?**
- Make sure all files are in correct folders
- Check that package.json is in root directory

**Changes not showing?**
- Clear browser cache
- Hard refresh (Ctrl + Shift + R)

**Data lost?**
- Data is stored in localStorage
- Clearing browser data will delete your board
- Export feature can be added in future updates

## 📱 Mobile Support

The app is desktop-first but mobile-functional:
- Pan and zoom work on touch devices
- Nodes can be dragged
- Best experienced on tablets/desktops

## 🚀 Future Enhancements (Not Included in Free Version)

- Export/Import board data
- Multiple boards
- Collaboration features
- Image OCR integration
- Geo-mapping integration
- Dark/Light theme toggle

## 📄 License

Free to use and modify for personal and commercial projects.

---

Built with React ⚛️ | Deployed on Vercel ▲
