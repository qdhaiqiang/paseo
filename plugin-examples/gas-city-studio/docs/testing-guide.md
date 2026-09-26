# Gas City Studio Plugin - Testing Guide

**Date**: 2026-09-26

## Overview

This guide explains how to test the Gas City Studio plugin in Paseo Desktop.

## Prerequisites

1. **Paseo Daemon**: Running (already started)

   ```bash
   # Check status
   paseo daemon status

   # Start if needed
   paseo daemon start
   ```

2. **Gas City Supervisor**: Running on configured URL
   - Default: `http://localhost:8080`
   - Configure via plugin settings if different

3. **Git Repository with Rigs**: At least one rig configured in Gas City

## Option 1: Development Mode (Recommended for Testing)

### Step 1: Build Desktop Dependencies

```bash
cd ~/git/paseo
npm run build:app-deps
```

This builds:

- Highlight library
- Client library
- Plugin framework
- Expo two-way audio

### Step 2: Start Desktop in Dev Mode

```bash
npm run dev:desktop
```

This will:

- Launch Electron app
- Connect to running daemon (port 6767)
- Load all installed plugins including gas-city-studio

### Step 3: Access the Plugin

1. Once Paseo Desktop opens
2. Look for "Gas City" in the sidebar or workspace panels
3. Click to open the panel
4. You should see rigs and sessions loaded from Supervisor

## Option 2: Official Desktop App

### Download and Install

1. Visit https://paseo.sh
2. Download latest version for your platform
3. Install and launch

### Plugin Availability

⚠️ **Important**: The official desktop app won't have access to our local plugin at `~/git/paseo/plugin-examples/gas-city-studio`.

To use the plugin with official desktop, you would need to:

1. Publish the plugin to npm
2. Install via `paseo plugin install @getpaseo/plugin-example-gas-city-studio`

## Testing Checklist

### Basic Functionality

- [ ] Plugin appears in workspace panel list
- [ ] Sidebar shows "Gas City" item
- [ ] Panel loads without errors
- [ ] Rigs are fetched and displayed
- [ ] Sessions load when rig is selected
- [ ] New session can be created

### Settings

- [ ] Command Center (Cmd/Ctrl+K) → "Configure Gas City Studio" opens settings
- [ ] Supervisor URL can be changed
- [ ] Font size changes affect transcript display
- [ ] Agent avatar toggle works
- [ ] Settings persist after restart

### Message Sending

- [ ] Session can be selected
- [ ] Transcript tab becomes active
- [ ] Message composer is visible
- [ ] Typing a message enables send button
- [ ] Clicking send shows loading state
- [ ] Toast notification shows "Message sent"
- [ ] User message appears in transcript
- [ ] Turn status shows "Processing..."

### SSE Streaming

- [ ] Assistant response appears in real-time
- [ ] Partial messages update as they arrive
- [ ] Final message has complete content
- [ ] Toast shows "Response received" when done

### Error Handling

- [ ] If Supervisor is down, error toast appears
- [ ] Plugin doesn't crash on connection errors
- [ ] Console shows detailed error logs
- [ ] User sees friendly error messages

## Troubleshooting

### Plugin Not Visible

**Check plugin status:**

```bash
paseo plugin ls gas-city-studio
```

Expected output:

```
PLUGIN                STATUS      ENABLED
gas-city-studio       disabled    yes
```

If `ENABLED` is `no`:

```bash
paseo plugin enable gas-city-studio
```

Note: `STATUS: disabled` is normal when Desktop is not running. It will change to `ready` when Desktop connects.

### Connection Errors

**Verify Supervisor is running:**

```bash
curl http://localhost:8080/v0/city/main/rigs
```

Should return JSON with rigs data.

**Check daemon logs:**

```bash
tail -f ~/.paseo/daemon.log | grep gas-city
```

### TypeScript/Lint Errors

The plugin code passes lint checks but may have type issues due to missing tsconfig. These are non-blocking for testing purposes.

## Current Limitations

1. **No Hot Reload**: Code changes require restarting Desktop
2. **Local Path Only**: Plugin only works from local directory
3. **No Authentication**: Assumes Supervisor is accessible without auth
4. **Single City**: Only connects to one city at a time

## Next Steps After Testing

1. Fix any bugs found during testing
2. Implement remaining P2 features:
   - Work Composer integration
   - Command Palette actions
   - Multi-session comparison
3. Prepare for publication:
   - Add comprehensive tests
   - Write user documentation
   - Create demo video

## Contact

For issues or questions, refer to:

- Plugin docs: `docs/phase2-progress-summary.md`
- Paseo docs: https://paseo.sh/docs/plugins
