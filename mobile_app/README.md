# deskline

A new Flutter project.

## Getting Started

This project is a starting point for a Flutter application.

A few resources to get you started if this is your first Flutter project:

- [Learn Flutter](https://docs.flutter.dev/get-started/learn-flutter)
- [Write your first Flutter app](https://docs.flutter.dev/get-started/codelab)
- [Flutter learning resources](https://docs.flutter.dev/reference/learning-resources)

For help getting started with Flutter development, view the
[online documentation](https://docs.flutter.dev/), which offers tutorials,
samples, guidance on mobile development, and a full API reference.

## CometChat Configuration

CometChat requires an **App ID** and **Region** at compile time. These are passed via Dart's `--dart-define` flags — no secrets are embedded in the client.

> **Note:** Auth tokens are generated server-side by the backend. Never place the CometChat Auth Key or REST API Key in client code.

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `COMETCHAT_APP_ID` | Your CometChat application ID (from Dashboard > App Settings) | `abc123def456` |
| `COMETCHAT_REGION` | Region selected during app creation (`us` or `eu`) | `us` |

### Running the App

Pass the CometChat variables when running or building:

```bash
# Development
flutter run \
  --dart-define=COMETCHAT_APP_ID=your_app_id_here \
  --dart-define=COMETCHAT_REGION=us

# Release build (Android)
flutter build apk \
  --dart-define=COMETCHAT_APP_ID=your_app_id_here \
  --dart-define=COMETCHAT_REGION=us

# Release build (iOS)
flutter build ios \
  --dart-define=COMETCHAT_APP_ID=your_app_id_here \
  --dart-define=COMETCHAT_REGION=us
```

### Accessing in Dart Code

The values are read at compile time using `String.fromEnvironment`:

```dart
// lib/cometchat/cometchat_config.dart
const cometchatAppId = String.fromEnvironment('COMETCHAT_APP_ID');
const cometchatRegion = String.fromEnvironment('COMETCHAT_REGION');
```

### IDE Configuration (VS Code)

Add a launch configuration to avoid typing `--dart-define` every time:

```json
// .vscode/launch.json
{
  "configurations": [
    {
      "name": "Deskline (CometChat)",
      "request": "launch",
      "type": "dart",
      "args": [
        "--dart-define=COMETCHAT_APP_ID=your_app_id_here",
        "--dart-define=COMETCHAT_REGION=us"
      ]
    }
  ]
}
```
