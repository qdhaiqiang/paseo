#!/bin/bash
# Gas City Studio Plugin Diagnostic Script
# This script helps diagnose why the plugin is not visible in Paseo Desktop

set -e

echo "=== Gas City Studio Plugin Diagnostics ==="
echo ""

# Check daemon status
echo "1. Daemon Status:"
paseo daemon status | grep -E "pid|listen|connectedDaemon" || echo "   ❌ Daemon not running"
echo ""

# Check plugin status
echo "2. Plugin Status:"
PLUGIN_STATUS=$(paseo plugin ls gas-city-studio 2>&1 | tail -1)
echo "   $PLUGIN_STATUS"
if echo "$PLUGIN_STATUS" | grep -q "disabled"; then
    echo "   ⚠️  Plugin is disabled - needs to be enabled"
elif echo "$PLUGIN_STATUS" | grep -q "ready"; then
    echo "   ✅ Plugin is ready"
fi
echo ""

# Check if Electron is running
echo "3. Electron Process:"
if ps aux | grep -i "electron.*paseo.*desktop" | grep -v grep > /dev/null; then
    echo "   ✅ Paseo Desktop Electron is running"
    ELECTRON_PID=$(ps aux | grep -i "electron.*paseo.*desktop" | grep -v grep | awk '{print $2}' | head -1)
    echo "   PID: $ELECTRON_PID"
else
    echo "   ❌ Paseo Desktop Electron not found"
    echo "   Try running: npm run dev:desktop"
fi
echo ""

# Check plugin files
echo "4. Plugin Files:"
PLUGIN_DIR="/Users/mahaiqiang/git/paseo/plugin-examples/gas-city-studio"
if [ -d "$PLUGIN_DIR" ]; then
    echo "   ✅ Plugin directory exists"
    echo "   Location: $PLUGIN_DIR"

    # Check key files
    if [ -f "$PLUGIN_DIR/index.client.tsx" ]; then
        echo "   ✅ index.client.tsx exists"
    else
        echo "   ❌ index.client.tsx missing"
    fi

    if [ -f "$PLUGIN_DIR/package.json" ]; then
        echo "   ✅ package.json exists"
    else
        echo "   ❌ package.json missing"
    fi

    if [ -f "$PLUGIN_DIR/paseo-plugin.json" ]; then
        echo "   ✅ paseo-plugin.json exists"
        PLUGIN_ID=$(cat "$PLUGIN_DIR/paseo-plugin.json" | grep '"id"' | cut -d'"' -f4)
        echo "   Plugin ID: $PLUGIN_ID"
    else
        echo "   ❌ paseo-plugin.json missing"
    fi
else
    echo "   ❌ Plugin directory not found"
fi
echo ""

# Check daemon logs for plugin errors
echo "5. Recent Daemon Logs (plugin-related):"
if [ -f ~/.paseo/daemon.log ]; then
    tail -100 ~/.paseo/daemon.log | grep -i "gas-city\|plugin" | tail -5 || echo "   No plugin-related log entries found"
else
    echo "   ❌ Daemon log not found"
fi
echo ""

# Check if Supervisor is running
echo "6. Gas City Supervisor:"
if curl -s http://localhost:8080/v0/city/main/rigs > /dev/null 2>&1; then
    echo "   ✅ Supervisor is running at http://localhost:8080"
    RIGS_COUNT=$(curl -s http://localhost:8080/v0/city/main/rigs | jq '.items | length' 2>/dev/null || echo "unknown")
    echo "   Available rigs: $RIGS_COUNT"
else
    echo "   ❌ Supervisor not reachable at http://localhost:8080"
    echo "   Make sure Gas City Supervisor is running"
fi
echo ""

echo "=== Troubleshooting Steps ==="
echo ""
echo "If plugin shows 'STATUS: disabled':"
echo "  1. The plugin is installed but Electron hasn't loaded it yet"
echo "  2. Try restarting Paseo Desktop completely"
echo "  3. Check if there's a plugin manager in the UI"
echo ""
echo "If plugin is not visible in UI:"
echo "  1. Look for workspace panel menu (right-click sidebar)"
echo "  2. Check if panels are hidden/collapsed"
echo "  3. Try Command Center (Cmd/Ctrl+K) and search for 'Gas City'"
echo ""
echo "For more help, see:"
echo "  docs/manual-testing-checklist.md"
