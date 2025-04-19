# KinaBot Scene Management System

A comprehensive scene management system for KinaBot that allows users to create, schedule, and execute scenes with multiple devices.

## Features

- Scene creation and management
- Device action sequencing
- Conditional execution
- Flexible scheduling (one-time, daily, weekly, monthly)
- Real-time execution
- Error handling and logging

## API Endpoints

### Scenes

- `GET /api/scenes` - List all scenes for the current user
- `GET /api/scenes/:id` - Get a specific scene
- `POST /api/scenes` - Create a new scene
- `PUT /api/scenes/:id` - Update a scene
- `DELETE /api/scenes/:id` - Delete a scene
- `POST /api/scenes/:id/execute` - Execute a scene

### Scene Schedules

- `POST /api/scenes/:id/schedules` - Create a new schedule for a scene
- `PUT /api/scenes/:id/schedules/:scheduleId` - Update a schedule
- `DELETE /api/scenes/:id/schedules/:scheduleId` - Delete a schedule

## Scene Structure

A scene consists of:

- Basic information (name, description)
- Actions (device commands to execute)
- Conditions (optional rules for execution)
- Schedules (optional timing rules)

## Scene Schedule Types

- `none` - One-time execution
- `daily` - Daily execution at specified time
- `weekly` - Weekly execution on specified days
- `monthly` - Monthly execution on specified days

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables:
   ```bash
   cp .env.example .env
   ```

3. Start the server:
   ```bash
   npm start
   ```

## Development

- Run in development mode:
  ```bash
  npm run dev
  ```

- Run tests:
  ```bash
  npm test
  ```

- Lint code:
  ```bash
  npm run lint
  ```

## License

MIT 