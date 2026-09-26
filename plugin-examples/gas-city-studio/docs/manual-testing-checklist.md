# Gas City Studio Plugin - Manual Testing Checklist

**Date**: 2026-09-26
**Status**: Ready for Manual Testing in Paseo Desktop

## Current Situation

Paseo Desktop Electron app is running, but the plugin shows `STATUS: disabled` in CLI. This is expected behavior - the plugin will only become `ready` when:

1. Paseo Desktop fully loads the workspace UI
2. The plugin's client code is executed in the renderer process
3. The plugin registers itself with the daemon

## How to Test in Paseo Desktop

### Step 1: Locate the Plugin Panel

In the Paseo Desktop window:

1. **Look at the left sidebar** - You should see icons for different panels
2. **Find "Gas City" or "GitBranch" icon** - This is our plugin
3. **Click the icon** - The panel should open in the workspace

If you don't see it:
- Check if there's a "Workspace Panels" menu (usually right-click on sidebar)
- Look for "Gas City Studio" in the panel list
- Enable it if it's hidden

### Step 2: Verify Initial Load

When the panel opens, you should see:

✅ **Expected:**
- Header showing "Gas City Studio"
- Left sidebar with "Rigs" section
- Empty or loading state in main area
- Toast notification: "Loaded X rig(s)"

❌ **If you see errors:**
- Red error toast → Check if Gas City Supervisor is running
- Blank screen → Check browser console (Cmd+Option+I in Electron)

### Step 3: Test Rig Selection

1. **Select a rig from the sidebar**
   - Click on a rig name
   - Sessions should load below
   - Toast: "Loaded X session(s)"

2. **Verify sessions appear**
   - Session list shows in sidebar
   - Each session has name and state

### Step 4: Test Session Selection

1. **Click on a session**
   - Tab switches to "Transcript"
   - Transcript viewer loads
   - Agent avatar appears at top
   - Toast: "Loaded transcript: X message(s)"

2. **Check transcript display**
   - Messages appear with role labels (User/Assistant/System)
   - Different background colors for different roles
   - Timestamps visible

### Step 5: Test Settings

1. **Open Command Center**
   - Press `Cmd+K` (Mac) or `Ctrl+K` (Windows/Linux)
   - Type "Configure Gas City Studio"
   - Press Enter

2. **Settings page should open**
   - Supervisor URL field
   - City name field
   - Auto-connect toggle
   - Show agent avatars toggle
   - Transcript font size dropdown

3. **Test changing settings**
   - Change font size to "Large"
   - Go back to transcript
   - Text should be larger
   - Toggle off "Show agent avatars"
   - Avatar should disappear from header

### Step 6: Test Message Sending

1. **With a session selected**
   - Scroll to bottom of transcript
   - Message composer should be visible

2. **Type a message**
   - Send button becomes enabled
   - Type "Hello, this is a test"

3. **Click Send**
   - Loading indicator appears
   - Toast: "Message sent"
   - User message appears in transcript
   - Turn status shows "Processing..."

4. **Wait for response**
   - Assistant message should appear via SSE
   - Toast: "Response received"
   - Turn status clears

### Step 7: Test Error Handling

1. **Stop Gas City Supervisor** (if running locally)
   ```bash
   # Find the process
   ps aux | grep gascity
   
   # Kill it
   kill <PID>
   ```

2. **Try to reload rigs**
   - Close and reopen the panel
   - Error toast should appear
   - Plugin should not crash
   - Console should show error details

## Expected Behavior Summary

| Feature | Expected Result | Status |
|---------|----------------|--------|
| Panel loads | Shows rigs/sessions | ⏸️ Pending |
| Settings | Configurable via Cmd+K | ⏸️ Pending |
| Font size | Changes transcript text | ⏸️ Pending |
| Avatar toggle | Shows/hides avatar | ⏸️ Pending |
| Message send | Optimistic UI + toast | ⏸️ Pending |
| SSE stream | Real-time updates | ⏸️ Pending |
| Error handling | Toast notifications | ⏸️ Pending |

## Troubleshooting

### Plugin Not Visible

**Check if plugin is loaded:**
```bash
paseo plugin ls gas-city-studio
```

If `ENABLED: no`:
```bash
paseo plugin enable gas-city-studio
```

Then restart Paseo Desktop.

### Blank Panel

**Open Developer Tools:**
- In Electron: `Cmd+Option+I` (Mac) or `Ctrl+Shift+I` (Windows/Linux)
- Go to Console tab
- Look for errors related to "gas-city" or "supervisor"

**Common errors:**
- `Failed to fetch` → Supervisor not running
- `Cannot read property` → TypeScript/runtime error
- `Module not found` → Build issue

### No Toast Notifications

Toast should appear in bottom-right corner. If not:
- Check if `useToast()` is working
- Look for React errors in console
- Verify Paseo's Toast provider is active

## What to Report

If you encounter issues, please provide:

1. **Screenshot** of the issue
2. **Console logs** (from Developer Tools)
3. **Daemon logs**: `tail -100 ~/.paseo/daemon.log`
4. **Plugin status**: `paseo plugin ls gas-city-studio`
5. **Steps to reproduce** the issue

## Next Steps After Testing

1. ✅ Mark completed items in checklist above
2. 🐛 Report any bugs found
3. 🔧 Fix issues based on feedback
4. 📝 Update documentation
5. 🚀 Prepare for wider testing/release

---

**Note**: Since we can't automate Electron UI testing easily, manual testing is essential. Please go through each step and report what works and what doesn't.
