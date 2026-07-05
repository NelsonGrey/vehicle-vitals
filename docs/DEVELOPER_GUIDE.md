# Vehicle Vitals - Developer Guide

**Version**: 1.0  
**Last Updated**: May 22, 2026
**Status**: ✅ ACTIVE  
**Owner**: Mark Nelson

---

## Table of Contents

1. [Welcome](#welcome)
2. [Getting Started](#getting-started)
3. [Development Environment Setup](#development-environment-setup)
4. [Project Structure](#project-structure)
5. [Development Workflow](#development-workflow)
6. [Code Standards](#code-standards)
7. [Testing](#testing)
8. [Debugging](#debugging)
9. [Contributing](#contributing)
10. [Resources](#resources)

---

## Welcome

Welcome to the Vehicle Vitals development team! This guide will help you set up your development environment and understand the project structure, coding standards, and workflows.

### What is Vehicle Vitals?

Vehicle Vitals is a cross-platform vehicle management application that helps users:

- Track vehicle information and maintenance history
- Look up VINs automatically using NHTSA API
- Receive maintenance reminders
- Export maintenance records for warranty claims

### Technology Stack

- **Web**: React 18 + Vite + TypeScript + Tailwind CSS
- **Mobile**: Flutter + Dart (iOS 15.0+ / Android)
- **Backend**: Firebase (Auth, Firestore, Functions, Hosting)
- **Monorepo**: npm workspaces
- **Version Control**: Git + GitHub
- **CI/CD**: GitHub Actions

---

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

#### Required Tools

| Tool             | Version  | Installation                                                                              |
| ---------------- | -------- | ----------------------------------------------------------------------------------------- |
| **Node.js**      | 20.x LTS | [nodejs.org](https://nodejs.org)                                                          |
| **npm**          | 9.x+     | Included with Node.js                                                                     |
| **Git**          | 2.x+     | [git-scm.com](https://git-scm.com)                                                        |
| **Firebase CLI** | Latest   | `npm install -g firebase-tools`                                                           |
| **Flutter**      | 3.24+    | [flutter.dev](https://flutter.dev/docs/get-started/install) (for mobile development only) |

#### Optional Tools

- **Visual Studio Code**: Recommended IDE ([code.visualstudio.com](https://code.visualstudio.com))
- **Android Studio**: For Android development
- **Xcode**: For iOS development (macOS only)

### Repository Setup

#### 1. Clone the Repository

```bash
git clone https://github.com/mnelson3/vehicle-vitals.git
cd vehicle-vitals
```

#### 2. Install Dependencies

**Option A: Automated Installation (Recommended)**

```bash
# Installs dependencies for root, web, and mobile packages
npm run install:all
```

**Option B: Manual Installation**

```bash
# Install root dependencies
npm install

# Install web dependencies
cd packages/web
npm install
cd ../..

# Install mobile dependencies (optional)
cd packages/mobile
flutter pub get
cd ../..
```

#### 3. Configure Firebase

**Development Environment**:

```bash
# Copy example environment file
cp packages/web/.env.example packages/web/.env.development

# Edit .env.development with your Firebase development project credentials
# Get credentials from Firebase Console > Project Settings > General
```

**Required Environment Variables**:

```bash
# packages/web/.env.development
VITE_FIREBASE_API_KEY=your-dev-api-key
VITE_FIREBASE_AUTH_DOMAIN=vehicle-vitals-dev.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=vehicle-vitals-dev
VITE_FIREBASE_STORAGE_BUCKET=vehicle-vitals-dev.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
VITE_FIREBASE_MEASUREMENT_ID=G-ABC123XYZ
```

#### 4. Start Development Servers

**Web Application**:

```bash
npm run dev:web
# Opens browser at http://localhost:5173
```

**Mobile Application**:

```bash
cd packages/mobile
flutter run
# Select iOS/Android device from list
```

**Firebase Emulators** (optional, for local backend testing):

```bash
firebase emulators:start
# Starts Firestore, Functions, and Hosting emulators
```

---

## Development Environment Setup

### Visual Studio Code Setup

#### Recommended Extensions

Install these VS Code extensions for the best development experience:

**General**:

- **ESLint** (`dbaeumer.vscode-eslint`) - JavaScript/TypeScript linting
- **Prettier** (`esbenp.prettier-vscode`) - Code formatting
- **GitLens** (`eamodio.gitlens`) - Enhanced Git integration
- **Error Lens** (`usernamehw.errorlens`) - Inline error highlighting

**Web Development**:

- **Vite** (`antfu.vite`) - Vite integration
- **Tailwind CSS IntelliSense** (`bradlc.vscode-tailwindcss`) - Tailwind class autocomplete
- **ES7+ React Snippets** (`dsznajder.es7-react-js-snippets`) - React code snippets

**Flutter Development**:

- **Flutter** (`Dart-Code.flutter`) - Flutter framework support
- **Dart** (`Dart-Code.dart-code`) - Dart language support

#### VS Code Settings

Create `.vscode/settings.json` in project root:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "tailwindCSS.experimental.classRegex": [
    ["clsx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ]
}
```

### Git Configuration

#### Configure User Info

```bash
git config user.name "Your Name"
git config user.email "your.email@example.com"
```

#### Recommended Git Aliases

```bash
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.st status
git config --global alias.unstage 'reset HEAD --'
git config --global alias.last 'log -1 HEAD'
```

---

## Project Structure

### Monorepo Layout

```
vehicle-vitals/
├── .github/                    # GitHub Actions CI/CD workflows
│   ├── workflows/
│   └── actions/
├── packages/
│   ├── web/                    # React web application
│   ├── mobile/                 # Flutter mobile application
│   ├── shared/                 # Shared utilities (types, Firebase config)
│   ├── functions/              # Firebase Cloud Functions
│   └── firebase-utils/         # Firebase utility library
├── docs/                       # Project documentation
├── scripts/                    # Build and utility scripts
├── firebase.json               # Firebase project configuration
├── firestore.rules             # Firestore security rules
├── firestore.indexes.json      # Firestore index definitions
├── package.json                # Root package.json (workspace config)
└── turbo.json                  # Turborepo configuration (optional)
```

### Web Application Structure

```
packages/web/
├── src/
│   ├── main.tsx               # App entry point
│   ├── App.tsx                # Root component with routing
│   ├── components/            # Reusable UI components
│   │   ├── Layout.tsx
│   │   ├── ProtectedRoute.tsx
│   │   ├── SiteHeader.tsx
│   │   └── SiteFooter.tsx
│   ├── pages/                 # Page-level components
│   │   ├── Home.tsx
│   │   ├── AddVehicle.tsx
│   │   ├── EditVehicle.tsx
│   │   ├── Login.tsx
│   │   └── ...
│   ├── shared/                # Shared context and config
│   │   ├── AuthContext.tsx
│   │   └── firebaseConfig.js
│   ├── utils/                 # Utility functions
│   │   ├── vehicleService.js
│   │   ├── vpicService.js
│   │   └── logger.js
│   ├── hooks/                 # Custom React hooks
│   └── styles.css             # Global styles
├── public/                    # Static assets
├── .env.development           # Development environment variables
├── .env.production            # Production environment variables
├── package.json
├── vite.config.ts             # Vite configuration
└── tsconfig.json              # TypeScript configuration
```

### Mobile Application Structure

```
packages/mobile/
├── lib/
│   ├── main.dart              # App entry point + routing
│   ├── screens/               # Full-screen views
│   │   ├── home_screen.dart
│   │   ├── add_vehicle_screen.dart
│   │   └── ...
│   ├── models/                # Data models
│   │   ├── vehicle.dart
│   │   └── maintenance.dart
│   ├── services/              # Business logic layer
│   │   ├── auth_service.dart
│   │   ├── firestore_service.dart
│   │   └── ...
│   ├── components/            # Reusable widgets
│   └── theme/                 # App theming
│       ├── app_theme.dart
│       └── design_tokens.dart
├── android/                   # Android-specific code
├── ios/                       # iOS-specific code
├── pubspec.yaml               # Flutter dependencies
└── analysis_options.yaml      # Dart linter configuration
```

---

## Development Workflow

### Branch Strategy

We follow **Git Flow** with the following branches:

```
main              # Production-ready code (protected)
  ↑
develop           # Integration branch (protected)
  ↑
feature/*         # Feature branches
bugfix/*          # Bug fix branches
hotfix/*          # Production hotfixes
```

### Creating a Feature Branch

```bash
# Start from develop branch
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/add-vehicle-photos

# Work on your feature...
git add .
git commit -m "feat: add vehicle photo upload functionality"

# Push to remote
git push origin feature/add-vehicle-photos
```

### Commit Message Convention

We use **Conventional Commits** format:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types**:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks (dependencies, build config)

**Examples**:

```bash
git commit -m "feat(web): add VIN scanner component"
git commit -m "fix(mobile): resolve crash on vehicle deletion"
git commit -m "docs: update API documentation"
git commit -m "chore: upgrade React to v18.3"
```

### Pull Request Process

1. **Create PR** from your feature branch to `develop`
2. **Fill out PR template** with description, testing notes
3. **Request review** from at least one team member
4. **Address feedback** and push changes
5. **Merge** after approval (squash merge preferred)

**PR Checklist**:

- [ ] Code follows project style guidelines
- [ ] All tests pass (`npm run test:web`)
- [ ] No linting errors (`npm run lint`)
- [ ] Documentation updated if needed
- [ ] Screenshots included for UI changes

---

## Code Standards

### JavaScript/TypeScript

#### Style Guide

We follow **Airbnb JavaScript Style Guide** with minor modifications.

**Key Rules**:

- **Indentation**: 2 spaces
- **Quotes**: Single quotes for strings
- **Semicolons**: Required
- **Line Length**: Max 100 characters
- **Naming**:
  - Variables/Functions: `camelCase`
  - Components: `PascalCase`
  - Constants: `UPPER_SNAKE_CASE`

#### ESLint Configuration

```javascript
// .eslintrc.js
module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  rules: {
    'no-console': 'warn',
    'react/prop-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
  },
};
```

#### Prettier Configuration

```json
// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

#### Example: Good Code Style

```typescript
import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../shared/firebaseConfig';

interface Vehicle {
  id: string;
  vin: string;
  make: string;
  model: string;
  year: number;
}

export const VehicleList: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const q = query(
          collection(db, 'vehicles'),
          where('userId', '==', user.uid)
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Vehicle[];
        setVehicles(data);
      } catch (error) {
        console.error('Failed to fetch vehicles:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="vehicle-list">
      {vehicles.map((vehicle) => (
        <div key={vehicle.id} className="vehicle-card">
          <h3>{vehicle.make} {vehicle.model}</h3>
          <p>{vehicle.year}</p>
        </div>
      ))}
    </div>
  );
};
```

### Dart/Flutter

#### Style Guide

We follow **Effective Dart** style guide.

**Key Rules**:

- Use `lowerCamelCase` for variables, methods
- Use `UpperCamelCase` for classes, enums
- Prefer `const` constructors when possible
- Use trailing commas for better formatting
- Max line length: 80 characters

#### Example: Good Dart Code Style

```dart
import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

class VehicleListScreen extends StatefulWidget {
  const VehicleListScreen({super.key});

  @override
  State<VehicleListScreen> createState() => _VehicleListScreenState();
}

class _VehicleListScreenState extends State<VehicleListScreen> {
  final FirebaseFirestore _db = FirebaseFirestore.instance;
  List<Vehicle> _vehicles = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchVehicles();
  }

  Future<void> _fetchVehicles() async {
    try {
      final snapshot = await _db
          .collection('vehicles')
          .where('userId', isEqualTo: userId)
          .get();

      setState(() {
        _vehicles = snapshot.docs
            .map((doc) => Vehicle.fromMap(doc.data()))
            .toList();
        _isLoading = false;
      });
    } catch (e) {
      debugPrint('Error fetching vehicles: $e');
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    return ListView.builder(
      itemCount: _vehicles.length,
      itemBuilder: (context, index) {
        final vehicle = _vehicles[index];
        return ListTile(
          title: Text('${vehicle.make} ${vehicle.model}'),
          subtitle: Text(vehicle.year.toString()),
        );
      },
    );
  }
}
```

---

## Testing

### Web Application Testing

#### Unit Tests

**Run Tests**:

```bash
cd packages/web
npm run test             # Run all unit tests (Vitest)
npm run test:watch       # Watch mode
npm run test:uat:chromium  # Playwright UAT (Chromium)
```

### Functions Testing

**Run Tests**:

```bash
cd packages/functions
npm run build
npm run test
```

**Focus areas covered**:

- Callable authentication and argument validation
- Calendar and reminder callable contracts
- Enterprise/member-role callables
- Vehicle transfer callable migration behavior

**Example: Component Test**:

```typescript
// VehicleCard.test.tsx
import { render, screen } from '@testing-library/react';
import { VehicleCard } from './VehicleCard';

describe('VehicleCard', () => {
  it('renders vehicle information correctly', () => {
    const vehicle = {
      id: '1',
      vin: 'ABC123',
      make: 'Honda',
      model: 'Accord',
      year: 2021,
    };

    render(<VehicleCard vehicle={vehicle} />);

    expect(screen.getByText('Honda Accord')).toBeInTheDocument();
    expect(screen.getByText('2021')).toBeInTheDocument();
  });
});
```

#### Integration Tests

**Example: Firebase Emulator Test**:

```typescript
// vehicleService.test.ts
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { vehicleService } from './vehicleService';

describe('Vehicle Service', () => {
  let testEnv;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'test-project',
      firestore: {
        host: 'localhost',
        port: 8080,
      },
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  it('creates a vehicle successfully', async () => {
    const vehicleData = {
      vin: '1HGBH41JXMN109186',
      make: 'Honda',
      model: 'Accord',
      year: 2021,
      mileage: 25000,
    };

    const vehicleId = await vehicleService.createVehicle(
      'user123',
      vehicleData
    );
    expect(vehicleId).toBeDefined();
  });
});
```

### Mobile Application Testing

#### Widget Tests

**Run Tests**:

```bash
cd packages/mobile
flutter test
flutter analyze
```

**Example: Widget Test**:

```dart
// vehicle_card_test.dart
import 'package:flutter_test/flutter_test.dart';
import 'package:vehicle_vitals/components/vehicle_card.dart';

void main() {
  testWidgets('VehicleCard displays vehicle information', (tester) async {
    final vehicle = Vehicle(
      id: '1',
      vin: 'ABC123',
      make: 'Honda',
      model: 'Accord',
      year: 2021,
      mileage: 25000,
    );

    await tester.pumpWidget(MaterialApp(
      home: Scaffold(
        body: VehicleCard(vehicle: vehicle),
      ),
    ));

    expect(find.text('Honda Accord'), findsOneWidget);
    expect(find.text('2021'), findsOneWidget);
  });
}
```

### Testing Checklist

Before submitting PR:

- [ ] All unit tests pass (web, mobile, functions)
- [ ] UAT checks pass for impacted web flows
- [ ] New features have test coverage
- [ ] Manual testing on dev environment
- [ ] Cross-browser testing (Chrome, Safari, Firefox)
- [ ] Mobile testing (iOS and Android)

---

## Debugging

### Web Application Debugging

#### Chrome DevTools

1. **Network Tab**: Monitor Firebase API calls
2. **Console**: View logs from `logger.js`
3. **Application Tab**: Inspect Firestore cache, Auth state
4. **React DevTools**: Inspect component tree, state

#### VS Code Debugging

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Launch Chrome",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}/packages/web"
    }
  ]
}
```

#### Firebase Debugging

**Enable Firestore Debug Logging**:

```javascript
import {
  enableIndexedDbPersistence,
  enableMultiTabIndexedDbPersistence,
} from 'firebase/firestore';
import { setLogLevel } from 'firebase/firestore';

if (import.meta.env.DEV) {
  setLogLevel('debug');
}
```

### Mobile Application Debugging

#### Flutter DevTools

**Launch DevTools**:

```bash
flutter run
# Press 'v' in terminal to open DevTools in browser
```

**Features**:

- **Widget Inspector**: Inspect widget tree
- **Memory**: Profile memory usage
- **Performance**: Analyze frame rendering
- **Network**: Monitor HTTP requests

#### Debugging Tips

**Print Debugging**:

```dart
debugPrint('Vehicle fetched: ${vehicle.make} ${vehicle.model}');
```

**Conditional Breakpoints** (VS Code):

1. Set breakpoint in code
2. Right-click breakpoint → Edit Breakpoint
3. Add condition: `vehicle.vin == 'ABC123'`

---

## Contributing

### Code Review Guidelines

When reviewing PRs:

- **Functionality**: Does the code work as intended?
- **Tests**: Are there adequate tests?
- **Style**: Does it follow code standards?
- **Security**: Are there any security concerns?
- **Performance**: Are there performance implications?

### Documentation

When adding new features:

- Update relevant documentation in `docs/`
- Add inline code comments for complex logic
- Update README if user-facing changes

### Performance Best Practices

#### Web Application

✅ **DO**:

- Lazy load pages with `React.lazy()`
- Memoize expensive computations with `useMemo()`
- Use `React.memo()` for components that rarely change
- Debounce search inputs

❌ **DON'T**:

- Fetch data on every render
- Store large objects in component state
- Use `index` as key in lists (use unique ID)

#### Mobile Application

✅ **DO**:

- Use `const` constructors wherever possible
- Use Firestore cursor pagination via `getVehicles({ pageSize })` / `getVehiclesPaginated()` (see `docs/FIREBASE_INDEXES.md`)
- Render vehicle thumbnails with `CachedImage` (web) or `VehicleThumbnail` (mobile)
- Let recoverable UI failures flow through `ErrorBoundary` (web Analytics) and Crashlytics (mobile)
- Use `Hero` animations for transitions

❌ **DON'T**:

- Build widgets in `build()` method unnecessarily
- Use `setState()` for large lists
- Perform heavy computations in `build()`

---

## Resources

### Documentation

- **Project Docs**: [/docs](/docs)
- **Firebase Docs**: https://firebase.google.com/docs
- **React Docs**: https://react.dev
- **Flutter Docs**: https://flutter.dev/docs
- **Vite Docs**: https://vitejs.dev

### Internal Resources

- **Architecture**: [ARCHITECTURE.md](/docs/ARCHITECTURE.md)
- **API Documentation**: [API_DATA_MODELS.md](/docs/API_DATA_MODELS.md)
- **Requirements**: [REQUIREMENTS.md](/docs/REQUIREMENTS.md)
- **Deployment**: [DEPLOY.md](/docs/DEPLOY.md)

### Learning Resources

**Firebase**:

- [Get Started with Firebase for Web](https://firebase.google.com/docs/web/setup)
- [Firestore Data Model Best Practices](https://firebase.google.com/docs/firestore/data-model)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)

**React**:

- [React Hooks](https://react.dev/reference/react)
- [React Router Tutorial](https://reactrouter.com/en/main/start/tutorial)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

**Flutter**:

- [Flutter Cookbook](https://flutter.dev/docs/cookbook)
- [Provider State Management](https://pub.dev/packages/provider)
- [FlutterFire Setup](https://firebase.flutter.dev/docs/overview)

### Community

- **GitHub Issues**: Report bugs or request features
- **Pull Requests**: Contribute code improvements
- **Discussions**: Ask questions, share ideas

---

## Quick Reference

### Common Commands

```bash
# Development
npm run dev:web                    # Start web dev server
npm run dev                        # Start all workspaces
flutter run                        # Run mobile app

# Building
npm run build:web                  # Build web for production
flutter build apk                  # Build Android APK
flutter build ios                  # Build iOS app

# Testing
npm run test:web                   # Run web tests
flutter test                       # Run Flutter tests
npm run lint                       # Lint all packages

# Deployment
firebase deploy --only hosting     # Deploy web app
firebase deploy --only functions   # Deploy Cloud Functions

# Utilities
npm run clean                      # Clean build artifacts
firebase emulators:start           # Start Firebase emulators
```

### Environment Variables

**Web** (`.env.development`, `.env.production`):

```bash
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
```

**Mobile**: Update `packages/mobile/lib/firebase_options.dart` (auto-generated by FlutterFire CLI)

---

**Document Revision History**:

- **v1.0** (Feb 16, 2026): Initial developer guide

**Maintained By**: Mark Nelson  
**Review Cycle**: Quarterly or on major workflow changes  
**Feedback**: Submit issues or PRs to [GitHub repository](https://github.com/mnelson3/vehicle-vitals)
