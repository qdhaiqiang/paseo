# Troubleshooting: Gas City Studio Plugin Not Visible in Paseo Desktop

## Problem

Plugin shows `STATUS: disabled` even though it's installed and enabled.

## Root Cause

Paseo Desktop Electron app was started **before** the plugin was installed. The renderer process loaded the list of plugins at startup and doesn't know about newly installed plugins.

## Solution

You need to **reload Paseo Desktop** to pick up the new plugin. There are several ways:

### Option 1: Reload the Window (Easiest)

In the Paseo Desktop window:
1. Press `Cmd+R` (Mac) or `Ctrl+R` (Windows/Linux)
2. Or use menu: View → Reload
3. Wait for the window to reload
4. Check if "Gas City" panel appears in sidebar

### Option 2: Restart Desktop App

1. Close the Paseo Desktop window completely
2. Stop the dev server in terminal (press `Ctrl+C`)
3. Run again:
   ```bash
   npm run dev:desktop
   ```
4. Wait for Electron to start
5. Check for the plugin

### Option 3: Hot Reload (If Supported)

Some versions of Paseo support hot reload:
1. Make a small change to `index.client.tsx`
2. Save the file
3. Vite/Electron should auto-reload

## Verification Steps

After reloading, verify the plugin is loaded:

### Step 1: Check CLI Status
```bash
cd ~/git/paseo
node packages/cli/dist/index.js plugin ls gas-city-studio
```

Expected output:
```
PLUGIN                STATUS    ENABLED
gas-city-studio       ready     yes
```

Note: `STATUS: ready` means Desktop has loaded the plugin!

### Step 2: Look in UI

In Paseo Desktop:
1. **Left sidebar** - Look for GitBranch icon or "Gas City" text
2. **Right-click sidebar** - Check "Workspace Panels" menu
3. **Command Center** - Press `Cmd+K`, type "Gas City"

### Step 3: Check Developer Console

1. In Paseo Desktop, press `Cmd+Option+I` (Mac) or `Ctrl+Shift+I` (Windows)
2. Go to Console tab
3. Look for messages containing "gas-city" or "plugin"
4. If you see errors, report them

## Common Issues

### Issue 1: Panel Hidden

The panel might be loaded but hidden.

**Fix:**
- Right-click on sidebar
- Look for "Gas City Studio" in the list
- Click to enable it

### Issue 2: Wrong Icon

You mentioned not seeing "GitBranch" icon.

**Explanation:**
- The icon name "GitBranch" is a symbolic name
- Paseo maps it to an actual icon (usually looks like a branch)
- It might not show the text "GitBranch"

**What to look for instead:**
- Any new icon in the sidebar that wasn't there before
- Hover over icons to see tooltips
- Look for "Gas City Studio" tooltip

### Issue 3: Plugin Failed to Load

Check console for errors like:
- `Failed to load plugin: gas-city-studio`
- `Module not found: ./client/GasCityStudioPanel`
- `Cannot read property 'addWorkspacePanel'`

**Fix:**
- Report the exact error message
- Check if all files exist in the plugin directory

## What I Tried

1. ✅ Installed plugin via CLI
2. ✅ Enabled plugin
3. ✅ Verified plugin files exist
4. ✅ Checked daemon is running
5. ✅ Confirmed Electron is running
6. ⏸️ Need to reload Desktop window

## Next Action

**Please try this:**

1. In the Paseo Desktop window, press `Cmd+R` to reload
2. Wait 5-10 seconds for everything to load
3. Look at the left sidebar for any new icons
4. Hover over each icon to see tooltips
5. Tell me what you see

If still not visible:
1. Press `Cmd+Option+I` to open DevTools
2. Go to Console tab
3. Take a screenshot of any errors
4. Share the screenshot with me

## Alternative: Use Command Center

Even if the panel icon is not visible, you might be able to open it via Command Center:

1. Press `Cmd+K` in Paseo Desktop
2. Type "Gas City"
3. If "Gas City Studio" appears in the list, click it
4. This should open the panel even if the icon is hidden
