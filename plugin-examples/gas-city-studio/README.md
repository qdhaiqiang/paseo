# Gas City Studio Plugin for Paseo

A workspace panel plugin that brings Gas City Studio's multi-agent collaboration capabilities to Paseo.

## Features

- **Multi-Rig Management**: Switch between different project rigs
- **Session Management**: View, create, and manage coding sessions
- **Multi-Agent Support**: Interact with multiple AI agents (Mayor, Dispatcher, etc.)
- **Real-time Transcript**: Stream session conversations with correlation support
- **Correlation Fields**: Uses `client_message_id` and `turn_id` for reliable request tracking

## Installation

```bash
cd ~/git/paseo
paseo plugin install ./plugin-examples/gas-city-studio
```

## Prerequisites

- Gas City Supervisor running on `http://localhost:8080`
- At least one rig configured in your Gas City

## Development

This plugin is built as part of the Gas City ecosystem, integrating the web prototype from [gascity-studio](https://github.com/qdhaiqiang/gascity) into Paseo's desktop environment.

### Key Components

- `index.client.tsx` - Plugin entry point
- `client/GasCityStudioPanel.tsx` - Main workspace panel UI
- `client/api/supervisor.ts` - Gas City Supervisor API client

### Architecture

The plugin connects directly to the Gas City Supervisor REST API and uses React Native components provided by Paseo's plugin system. It maintains compatibility with the correlation fields (`client_message_id`, `turn_id`) added in Phase 1 of the Gas City correlation patch.

## License

MIT
