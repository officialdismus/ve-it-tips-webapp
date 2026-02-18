# 🧪 Testing the Village Enterprise IT Tips Web App

## Quick Start (Super Simple!)

### Step 1: Start the Server
1. **Double-click** `start-server.bat` in your project folder
2. A friendly window will open with instructions
3. **Press any key** to start the server
4. **Open your browser** and go to: `http://localhost:8000`
5. **Close the window** to stop the server

### Step 2: Open in Browser
1. Open your web browser (Chrome, Edge, Firefox, etc.)
2. Go to: `http://localhost:8000`
3. The app should load automatically

---

## Testing the Main Page (index.html)

### Step 3: Test Main Page Features
- **Search:** Type in the search box (try "email" or "slack")
- **Filter:** Use the category dropdown to filter by category
- **Cards:** Browse the card-based layout showing all IT tips
- **Modal:** Click "Show Steps" buttons to open popup modals with step-by-step instructions
- **Modal Close:** Click outside modal, press ESC, or click × to close

---

## Testing the Steps Detail Page (steps.html)

### Step 4: Navigate to Steps Page
1. Click on any tip card's "Show Steps" button OR click the title/description
2. You'll be taken to `steps.html?id=XXX` (detail page)
3. The page shows:
   - Category badge at the top
   - Issue title
   - Description
   - Full step-by-step instructions

### Step 5: Test Detail Page Features

#### Checklist Mode
1. Click the **Checklist** button to enable checklist mode
2. Checkboxes appear next to each step
3. **Sequential completion:** You must complete steps in order (can't skip ahead)
4. Unchecking a step unchecks all following steps
5. Progress is saved automatically to your browser (localStorage)
6. Refresh the page - your progress is remembered!

#### Copy Steps
1. Click **Copy all steps** to copy all steps to clipboard
2. Button shows "Copied!" confirmation
3. Paste anywhere to share the steps

#### Print Guide
1. Click **Print this guide** to open the browser print dialog
2. Print or save as PDF for offline reference

#### Back Navigation
1. Click "← Back to all tips" to return to the main list
2. Use browser back button also works

---

## Mobile Testing

### Step 6: Test Mobile Responsiveness
- Resize browser window to test mobile view
- Or use browser dev tools (F12 → Toggle device toolbar)
- Verify:
  - Cards stack properly on small screens
  - Buttons are touch-friendly
  - Text is readable
  - Modal fits on mobile screens
  - Steps detail page is usable on mobile

---

## What Should You See?

### Main Page (index.html)
✅ **Cards** loading from Google Sheet  
✅ **Search box** that filters results in real-time  
✅ **Category dropdown** with all your IT categories  
✅ **Show Steps** buttons that open 70% width popup modals  
✅ **Modal popups** with well-aligned, numbered steps  
✅ **Mobile-responsive** design  

### Steps Detail Page (steps.html)
✅ **Category badge** at top  
✅ **Issue title** and **description**  
✅ **Step-by-step list** with numbered items  
✅ **Checklist button** - enables sequential checkbox tracking  
✅ **Copy all steps button** - copies to clipboard  
✅ **Print this guide button** - opens print dialog  
✅ **Progress indicator** showing completed steps  
✅ **LocalStorage persistence** - progress saved between visits  
✅ **Back link** to return to main page  
✅ **Metadata** showing creator and last updated date  

---

## Troubleshooting

### If nothing loads:
- Make sure the server window shows "Server started successfully!"
- Try refreshing the browser (Ctrl+F5 or Cmd+Shift+R)
- Check that you went to `http://localhost:8000` (not just opening index.html)

### If you see "Error" message:
- Open browser console (F12 → Console tab)
- Look for any error messages
- Common issue: Google Sheet not published or URL incorrect

### If server won't start:
- Try right-clicking `start-server.bat` → "Run as administrator"
- Check if antivirus is blocking PowerShell
- Try the manual PowerShell method in README.md

### If checklist doesn't work:
- Make sure you're on the steps detail page (steps.html)
- Checklist is disabled by default - click "Checklist" button to enable
- Check browser supports localStorage
- Try in incognito mode if localStorage is blocked

---

## Ready for Production?

Once testing works, deploy to GitHub Pages:
1. Create GitHub repository (or use existing)
2. Push these files:
   - index.html
   - steps.html
   - style.css
   - script.js
   - steps.js
   - assets/
3. Enable GitHub Pages in repository settings
4. Site will be live at: `https://YOUR_USERNAME.github.io/REPO_NAME/`

**No more CORS issues after deployment!**

---

Need help? Check the main README.md for detailed instructions.
