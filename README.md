# 📘 Village Enterprise IT Tips Web App

A simple, fast, mobile-friendly web application that displays common IT tasks, tips, and troubleshooting guides for Village Enterprise staff and IT support teams.

## 🎯 Project Overview

This project transforms an internal IT knowledge spreadsheet into a **modern, accessible, branded web app** that serves as a self-help knowledge base for everyday IT issues such as:

- Google Workspace usage
- Slack tips
- Windows troubleshooting
- Zoom, Box, passwords, and device issues

### Target Users

- Village Enterprise staff
- Field mentors
- IT support staff
- New hires and non-technical users

## 🚀 Core Problem Being Solved

Currently, IT tips are stored in a **shared Google Sheet** (CSV-structured) that:
- Is not user-friendly
- Is hard to search and filter
- Is not optimized for mobile
- Requires spreadsheet access and knowledge

This project converts that data into a **read-only, responsive web app** that:
- Requires no login
- Is accessible from any device
- Loads fast
- Is easy to search and browse

## 📊 Data Source

The application automatically pulls data from a **Google Sheet** published as **CSV**.

### CSV Columns Structure:

- `ID`
- `Category`
- `Issue`
- `Description`
- `Steps`
- `CreatedBy`
- `Timestamp`

The Google Sheet is:
- Maintained by IT staff
- Updated collaboratively
- Published to the web as CSV
- Used as the **single source of truth**

**No backend database is used.**

## ✨ Key Features

### User-Facing Features:

- ✅ Card-based layout (instead of tables)
- ✅ Search by issue or description
- ✅ Filter by category (Google Workspace, Slack, Windows, etc.)
- ✅ Expand/collapse steps per card
- ✅ Mobile-first responsive design
- ✅ Clear, readable steps formatting
- ✅ Village Enterprise branding and colors

### UX Principles:

- Beginner-friendly
- Minimal clicks
- Large touch targets
- Works on slow connections
- No authentication required

## 🛠️ Technology Stack (100% Free)

| Layer           | Technology                      |
| --------------- | ------------------------------- |
| Frontend        | HTML5, CSS3, Vanilla JavaScript |
| Data            | Google Sheets (CSV export)     |
| Version Control | Git + GitHub                    |
| Hosting         | GitHub Pages                    |
| Editor          | Cursor AI                       |
| OS              | Windows 11 Enterprise           |

**No frameworks** (React, Next.js, etc.) are used to:
- Reduce complexity
- Avoid build steps
- Ensure long-term maintainability

## 📁 Repository Structure

```
ve-it-tips-webapp/
├── assets/         # Images, logos, icons
├── index.html      # Main UI structure
├── style.css       # Village Enterprise theme styles
├── script.js       # CSV fetch, parsing, rendering logic
├── README.md       # Project documentation
└── .gitignore      # Git ignore rules
```

## 🌐 Hosting & Deployment

The application is hosted **for free on GitHub Pages** and served as a **static site**.

### Deployment Flow:

1. Code written locally using Cursor
2. Changes committed to Git
3. Pushed to GitHub repository
4. GitHub Pages automatically serves the site

**No servers, APIs, or paid services are required.**

## 🔧 Setup Instructions

### Prerequisites:

- A published Google Sheet with CSV export enabled
- A web browser
- Git (for version control)

### Configuration:

1. Open `script.js`
2. Update the `GOOGLE_SHEET_CSV_URL` constant with your published Google Sheet CSV URL:
   ```javascript
   const GOOGLE_SHEET_CSV_URL = 'YOUR_PUBLISHED_CSV_URL_HERE';
   ```

### Running Locally:

**Important:** Due to CORS restrictions, you cannot test by opening `index.html` directly in the browser. You need to use a local web server.

#### 🖱️ **Easiest Option: Double-click the batch file** (Recommended)

1. **Double-click** `start-server.bat` in your project folder
2. A window will open showing server startup messages
3. **Press any key** to start the server
4. **Open your browser** and go to: `http://localhost:8000`
5. **Close the window** to stop the server

That's it! No coding or command line knowledge needed.

#### Alternative Options (for developers):

##### Option 1: Use the PowerShell Server

1. Open PowerShell in the project directory
2. Run: `.\start-server.ps1`
3. Open your browser and go to: `http://localhost:8000`
4. Press `Ctrl+C` to stop the server

##### Option 2: Use Python (if installed)

1. Open terminal in the project directory
2. Run: `python -m http.server 8000`
3. Open your browser and go to: `http://localhost:8000`

##### Option 3: Use Node.js (if installed)

1. Install http-server: `npm install -g http-server`
2. Run: `http-server -p 8000`
3. Open your browser and go to: `http://localhost:8000`

**Note:** Once deployed to GitHub Pages, CORS issues won't occur since the site will be served over HTTP/HTTPS.

## 🎨 Design Approach

### Layout Choice:

**Cards instead of tables** because:
- Better for mobile
- Easier to scan
- Cleaner presentation
- Works well for step-based instructions

### Visual Theme:

- Inspired by **Village Enterprise brand**
- Clean, professional, non-technical look
- Clear typography
- High contrast for readability

## 🔒 Security & Privacy Considerations

- No personal or sensitive data edited through the app
- The app is **read-only**
- Data visibility follows existing Google Sheet access rules
- No authentication or storage of user data
- No cookies or tracking

## 🚧 Future Enhancements (Not in MVP)

- Icons per category
- Bookmark/favorites (localStorage)
- Submit new tips via Google Form
- Offline cached version
- Sorting by date or category
- Admin-only editing UI (optional later)

## ✅ Success Criteria

The project is considered successful if:

- ✅ Non-technical staff can find IT help without contacting IT
- ✅ The app loads fast on mobile
- ✅ IT tips are easier to consume than a spreadsheet
- ✅ Updates to Google Sheets reflect automatically on the site
- ✅ The app requires **zero ongoing hosting cost**

## 📝 Development Philosophy

- **Keep it simple**
- **Readable code over clever code**
- **Beginner-friendly**
- **Field-friendly**
- **Low maintenance**
- **No vendor lock-in**

This project should be easy for another IT associate to understand and maintain in the future.

## 📄 License

Internal use only - Village Enterprise

## 👥 Contributing

To update IT tips, edit the Google Sheet. Changes will automatically appear in the web app after the sheet is republished.

---

**Built with ❤️ for Village Enterprise**
