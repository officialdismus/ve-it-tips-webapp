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

### Step 3: Test the Features
- **Search:** Type in the search box (try "email" or "slack")
- **Filter:** Use the category dropdown to filter by category
- **Steps:** Click "Show Steps" buttons to open beautiful popup modals with well-aligned instructions
- **Modal:** Click outside modal or press ESC to close, click × to close
- **Mobile:** Resize browser window or use dev tools to test mobile view

### Step 4: Stop the Server
- Close the command window that opened

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

---

## What Should You See?

✅ **21 cards** loading from Google Sheet
✅ **Search box** that filters results
✅ **Category dropdown** with all your IT categories
✅ **Show Steps** buttons that open beautiful 70% width popup modals
✅ **Modal popups** with well-aligned, numbered steps and responsive design
✅ **Mobile-responsive** design

---

## Ready for Production?

Once testing works, deploy to GitHub Pages:
1. Create GitHub repository
2. Push these files
3. Enable GitHub Pages
4. Site will be live at: `https://YOUR_USERNAME.github.io/REPO_NAME/`

**No more CORS issues after deployment!**

---

Need help? Check the main README.md for detailed instructions.