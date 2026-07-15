# Vehicle-Vitals - Component Library

**Version**: 1.0  
**Last Updated**: February 16, 2026  
**Status**: ✅ ACTIVE  
**Owner**: Mark Nelson

---

## Table of Contents

1. [Overview](#overview)
2. [Web Components (React)](#web-components-react)
3. [Mobile Components (Flutter)](#mobile-components-flutter)
4. [Component Guidelines](#component-guidelines)
5. [Styling Guide](#styling-guide)
6. [Accessibility](#accessibility)

---

## Overview

This document provides a comprehensive reference for all reusable UI components in the Vehicle-Vitals application, covering both the web (React + TypeScript) and mobile (Flutter + Dart) platforms.

### Component Philosophy

- **Reusable**: Components should be generic and reusable across the application
- **Composable**: Small, focused components that can be composed together
- **Accessible**: WCAG 2.1 AA compliant with proper ARIA attributes
- **Consistent**: Follow design system and style guide
- **Documented**: Clear props/parameters and usage examples

### Technology Stack

**Web**:

- React 18.0+
- TypeScript 5.6+
- Tailwind CSS 3.4+
- React Router 6.0+

**Mobile**:

- Flutter 3.24+
- Dart (latest)
- Material Design 3
- go_router

---

## Web Components (React)

### Layout Components

#### `<Layout>`

**Location**: `packages/web/src/components/Layout.tsx`

**Description**: Main application layout wrapper with header, footer, and content area.

**Props**:

```typescript
interface LayoutProps {
  children: React.ReactNode;
  showHeader?: boolean;
  showFooter?: boolean;
  className?: string;
}
```

**Usage**:

```tsx
import Layout from '../components/Layout';

function MyPage() {
  return (
    <Layout>
      <h1>Page Content</h1>
    </Layout>
  );
}
```

**Features**:

- Responsive design
- Sticky header
- Footer with copyright
- Content overflow handling

**Visual Structure**:

```
┌─────────────────────────────────┐
│         SiteHeader              │
├─────────────────────────────────┤
│                                 │
│         {children}              │
│                                 │
├─────────────────────────────────┤
│         SiteFooter              │
└─────────────────────────────────┘
```

---

#### `<SiteHeader>`

**Location**: `packages/web/src/components/SiteHeader.tsx`

**Description**: Application header with navigation, logo, and user menu.

**Props**:

```typescript
interface SiteHeaderProps {
  user?: User | null;
  onLogout?: () => void;
}
```

**Usage**:

```tsx
import SiteHeader from '../components/SiteHeader';
import { useAuth } from '../shared/AuthContext';

function App() {
  const { user, logout } = useAuth();

  return <SiteHeader user={user} onLogout={logout} />;
}
```

**Features**:

- Logo and app name
- Navigation links (Home, Vehicles, Maintenance, Reports)
- User dropdown menu
- Responsive mobile menu (hamburger)
- Logout button

**Responsive Breakpoints**:

- **Desktop** (≥768px): Horizontal navigation
- **Mobile** (<768px): Hamburger menu

---

#### `<SiteFooter>`

**Location**: `packages/web/src/components/SiteFooter.tsx`

**Description**: Application footer with copyright and links.

**Props**:

```typescript
interface SiteFooterProps {
  showLinks?: boolean;
}
```

**Usage**:

```tsx
import SiteFooter from '../components/SiteFooter';

function Layout({ children }) {
  return (
    <>
      {children}
      <SiteFooter showLinks />
    </>
  );
}
```

**Features**:

- Copyright text
- Privacy Policy link
- Terms of Service link
- Contact information

---

### Authentication Components

#### `<ProtectedRoute>`

**Location**: `packages/web/src/components/ProtectedRoute.tsx`

**Description**: Route wrapper that requires authentication. Redirects to login if user not authenticated.

**Props**:

```typescript
interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}
```

**Usage**:

```tsx
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
```

**Features**:

- Checks authentication state
- Redirects unauthenticated users to login
- Preserves intended destination in state
- Loading state while checking auth

**Flow Diagram**:

```
User navigates to /home
        ↓
ProtectedRoute checks auth
        ↓
   ┌────────────┐
   │ Logged in? │
   └─────┬──────┘
         │
    ┌────┴────┐
    │         │
   Yes       No
    │         │
    │    Redirect to /login
    ↓    (save /home in state)
 Render
 <Home />
```

---

### Vehicle Components

#### `<VehicleCard>`

**Location**: `packages/web/src/components/VehicleCard.tsx`

**Description**: Card displaying vehicle summary information.

**Props**:

```typescript
interface VehicleCardProps {
  vehicle: Vehicle;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}
```

**Usage**:

```tsx
import VehicleCard from '../components/VehicleCard';

function VehicleList() {
  const vehicles = useVehicles();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {vehicles.map(vehicle => (
        <VehicleCard
          key={vehicle.id}
          vehicle={vehicle}
          onClick={() => navigate(`/vehicle/${vehicle.id}`)}
          onEdit={() => navigate(`/edit-vehicle/${vehicle.id}`)}
          onDelete={() => handleDelete(vehicle.id)}
          showActions
        />
      ))}
    </div>
  );
}
```

**Features**:

- Vehicle image thumbnail
- Make, Model, Year display
- VIN (last 6 digits)
- Current mileage
- Action buttons (Edit, Delete)
- Hover effects

**Visual Layout**:

```
┌──────────────────────────┐
│   [Vehicle Image]        │
├──────────────────────────┤
│ 2024 Toyota Camry        │
│ VIN: ...123456          │
│ Mileage: 15,234 miles   │
├──────────────────────────┤
│  [Edit]  [Delete]        │
└──────────────────────────┘
```

---

#### `<VehicleForm>`

**Location**: `packages/web/src/components/VehicleForm.tsx`

**Description**: Form for creating/editing vehicle information.

**Props**:

```typescript
interface VehicleFormProps {
  initialData?: Partial<Vehicle>;
  onSubmit: (data: VehicleFormData) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  loading?: boolean;
}
```

**Usage**:

```tsx
import VehicleForm from '../components/VehicleForm';

function AddVehicle() {
  const handleSubmit = async data => {
    await createVehicle(data);
    navigate('/home');
  };

  return (
    <VehicleForm
      onSubmit={handleSubmit}
      onCancel={() => navigate('/home')}
      submitLabel="Add Vehicle"
    />
  );
}
```

**Fields**:

- VIN (text input, 17 chars)
- Year (number input, 1900-current year)
- Make (text input)
- Model (text input)
- Trim (text input, optional)
- Color (text input, optional)
- License Plate (text input, optional)
- Purchase Date (date picker, optional)
- Purchase Price (currency input, optional)
- Current Mileage (number input)

**Validation**:

```typescript
const validateVehicleForm = (data: VehicleFormData): string[] => {
  const errors: string[] = [];

  if (!data.vin || !/^[A-HJ-NPR-Z0-9]{17}$/i.test(data.vin)) {
    errors.push('Valid 17-character VIN required');
  }

  if (
    !data.year ||
    data.year < 1900 ||
    data.year > new Date().getFullYear() + 1
  ) {
    errors.push('Valid year required');
  }

  if (!data.make?.trim()) {
    errors.push('Make is required');
  }

  if (!data.model?.trim()) {
    errors.push('Model is required');
  }

  if (data.mileage < 0) {
    errors.push('Mileage must be positive');
  }

  return errors;
};
```

---

### Maintenance Components

#### `<MaintenanceCard>`

**Location**: `packages/web/src/components/MaintenanceCard.tsx`

**Description**: Card displaying maintenance record summary.

**Props**:

```typescript
interface MaintenanceCardProps {
  maintenance: MaintenanceRecord;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}
```

**Usage**:

```tsx
import MaintenanceCard from '../components/MaintenanceCard';

function MaintenanceHistory({ vehicleId }) {
  const records = useMaintenanceRecords(vehicleId);

  return (
    <div className="space-y-4">
      {records.map(record => (
        <MaintenanceCard
          key={record.id}
          maintenance={record}
          onClick={() => navigate(`/maintenance/${record.id}`)}
          showActions
        />
      ))}
    </div>
  );
}
```

**Features**:

- Maintenance type icon
- Service date
- Mileage at service
- Cost
- Description
- Service provider
- Status badge (Completed, Scheduled, Overdue)

**Visual Layout**:

```
┌──────────────────────────────────────┐
│ 🔧 Oil Change     [Completed]        │
│ Jan 15, 2024 • 15,234 miles         │
│ Jiffy Lube                          │
│ $45.99                              │
│ ─────────────────────────────       │
│ Synthetic oil change, oil filter    │
│ replacement                         │
└──────────────────────────────────────┘
```

---

#### `<MaintenanceForm>`

**Location**: `packages/web/src/components/MaintenanceForm.tsx`

**Description**: Form for creating/editing maintenance records.

**Props**:

```typescript
interface MaintenanceFormProps {
  vehicleId: string;
  initialData?: Partial<MaintenanceRecord>;
  onSubmit: (data: MaintenanceFormData) => Promise<void>;
  onCancel?: () => void;
}
```

**Fields**:

- Vehicle (dropdown, pre-selected if vehicleId provided)
- Type (dropdown: Oil Change, Tire Rotation, Brake Service, etc.)
- Date (date picker)
- Mileage (number input)
- Cost (currency input, optional)
- Service Provider (text input, optional)
- Description (textarea, optional)
- Next Service Date (date picker, optional)
- Next Service Mileage (number input, optional)

---

### Form Components

#### `<Input>`

**Location**: `packages/web/src/components/Input.tsx`

**Description**: Styled text input field with label and error display.

**Props**:

```typescript
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
}
```

**Usage**:

```tsx
import Input from '../components/Input';

function Form() {
  const [vin, setVin] = useState('');
  const [error, setError] = useState('');

  return (
    <Input
      label="VIN"
      value={vin}
      onChange={e => setVin(e.target.value)}
      error={error}
      required
      maxLength={17}
      placeholder="Enter 17-character VIN"
    />
  );
}
```

**Features**:

- Label with optional asterisk for required fields
- Error message display
- Helper text
- Tailwind styling
- Accessibility (aria-labels, aria-invalid)

---

#### `<Button>`

**Location**: `packages/web/src/components/Button.tsx`

**Description**: Styled button with variants and loading state.

**Props**:

```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}
```

**Usage**:

```tsx
import Button from '../components/Button';
import { PlusIcon } from '@heroicons/react/24/outline';

function Toolbar() {
  const [loading, setLoading] = useState(false);

  return (
    <>
      <Button
        variant="primary"
        size="md"
        leftIcon={<PlusIcon className="w-5 h-5" />}
        onClick={handleAdd}
        loading={loading}
      >
        Add Vehicle
      </Button>

      <Button variant="secondary" onClick={handleCancel}>
        Cancel
      </Button>

      <Button variant="danger" onClick={handleDelete}>
        Delete
      </Button>
    </>
  );
}
```

**Variants**:

- **primary**: Blue background, white text (main actions)
- **secondary**: Gray border, gray text (secondary actions)
- **danger**: Red background, white text (destructive actions)
- **ghost**: Transparent background (subtle actions)

---

### Utility Components

#### `<Loading>`

**Location**: `packages/web/src/components/Loading.tsx`

**Description**: Loading spinner indicator.

**Props**:

```typescript
interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
}
```

**Usage**:

```tsx
import Loading from '../components/Loading';

function DataLoader() {
  const [loading, setLoading] = useState(true);

  if (loading) {
    return <Loading size="lg" text="Loading vehicles..." />;
  }

  return <DataDisplay />;
}
```

---

#### `<ErrorBoundary>`

**Location**: `packages/web/src/components/ErrorBoundary.tsx`

**Description**: Error boundary to catch React component errors.

**Props**:

```typescript
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}
```

**Usage**:

```tsx
import ErrorBoundary from '../components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary
      fallback={<div>Something went wrong</div>}
      onError={error => console.error('Error:', error)}
    >
      <AppContent />
    </ErrorBoundary>
  );
}
```

---

## Mobile Components (Flutter)

### Layout Components

#### `AppScaffold`

**Location**: `packages/mobile/lib/widgets/app_scaffold.dart`

**Description**: Base scaffold with app bar and navigation drawer.

**Parameters**:

```dart
class AppScaffold extends StatelessWidget {
  final String title;
  final Widget body;
  final Widget? floatingActionButton;
  final List<Widget>? actions;
  final bool showDrawer;

  const AppScaffold({
    Key? key,
    required this.title,
    required this.body,
    this.floatingActionButton,
    this.actions,
    this.showDrawer = true,
  }) : super(key: key);
}
```

**Usage**:

```dart
import 'package:vehicle_vitals/widgets/app_scaffold.dart';

class HomeScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      title: 'My Vehicles',
      body: VehicleList(),
      floatingActionButton: FloatingActionButton(
        onPressed: () => context.go('/add-vehicle'),
        child: Icon(Icons.add),
      ),
    );
  }
}
```

**Features**:

- App bar with title
- Navigation drawer
- Floating action button support
- Custom actions in app bar
- Material Design 3 styling

---

#### `NavigationDrawer`

**Location**: `packages/mobile/lib/widgets/navigation_drawer.dart`

**Description**: Side navigation drawer with menu items.

**Features**:

- User profile section
- Menu items (Home, Vehicles, Maintenance, Reports, Settings)
- Logout button
- Version information

**Visual Layout**:

```
┌─────────────────────────┐
│   [User Avatar]         │
│   John Doe              │
│   john@example.com      │
├─────────────────────────┤
│ 🏠 Home                 │
│ 🚗 Vehicles             │
│ 🔧 Maintenance          │
│ 📊 Reports              │
│ ⚙️  Settings            │
├─────────────────────────┤
│ 🚪 Logout               │
├─────────────────────────┤
│ Version 1.0.0           │
└─────────────────────────┘
```

---

### Vehicle Components

#### `VehicleCard`

**Location**: `packages/mobile/lib/widgets/vehicle_card.dart`

**Description**: Card widget displaying vehicle information.

**Parameters**:

```dart
class VehicleCard extends StatelessWidget {
  final Vehicle vehicle;
  final VoidCallback? onTap;
  final VoidCallback? onEdit;
  final VoidCallback? onDelete;
  final bool showActions;

  const VehicleCard({
    Key? key,
    required this.vehicle,
    this.onTap,
    this.onEdit,
    this.onDelete,
    this.showActions = false,
  }) : super(key: key);
}
```

**Usage**:

```dart
import 'package:vehicle_vitals/widgets/vehicle_card.dart';

class VehicleList extends StatelessWidget {
  final List<Vehicle> vehicles;

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      itemCount: vehicles.length,
      itemBuilder: (context, index) {
        final vehicle = vehicles[index];
        return VehicleCard(
          vehicle: vehicle,
          onTap: () => context.go('/vehicle/${vehicle.id}'),
          onEdit: () => context.go('/edit-vehicle/${vehicle.id}'),
          onDelete: () => _handleDelete(context, vehicle.id),
          showActions: true,
        );
      },
    );
  }
}
```

**Features**:

- Vehicle image
- Make, Model, Year
- VIN (last 6 digits)
- Current mileage
- Swipe actions (Edit, Delete)
- Material elevation
- Ripple effect on tap

---

#### `VehicleForm`

**Location**: `packages/mobile/lib/widgets/vehicle_form.dart`

**Description**: Form for adding/editing vehicles.

**Parameters**:

```dart
class VehicleForm extends StatefulWidget {
  final Vehicle? initialVehicle;
  final Function(Vehicle) onSubmit;

  const VehicleForm({
    Key? key,
    this.initialVehicle,
    required this.onSubmit,
  }) : super(key: key);
}
```

**Usage**:

```dart
class AddVehicleScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Add Vehicle')),
      body: VehicleForm(
        onSubmit: (vehicle) async {
          await FirestoreService().addVehicle(vehicle);
          context.go('/home');
        },
      ),
    );
  }
}
```

**Fields**:

- VIN input with scanner button
- Year picker
- Make input
- Model input
- Trim input (optional)
- Color picker
- License plate input (optional)
- Purchase date picker (optional)
- Purchase price input (optional)
- Current mileage input

**Validation**:

```dart
String? validateVIN(String? value) {
  if (value == null || value.isEmpty) {
    return 'VIN is required';
  }
  if (!RegExp(r'^[A-HJ-NPR-Z0-9]{17}$').hasMatch(value)) {
    return 'VIN must be 17 characters (no I, O, or Q)';
  }
  return null;
}
```

---

### Maintenance Components

#### `MaintenanceCard`

**Location**: `packages/mobile/lib/widgets/maintenance_card.dart`

**Description**: Card displaying maintenance record.

**Parameters**:

```dart
class MaintenanceCard extends StatelessWidget {
  final Maintenance maintenance;
  final VoidCallback? onTap;
  final VoidCallback? onEdit;
  final VoidCallback? onDelete;

  const MaintenanceCard({
    Key? key,
    required this.maintenance,
    this.onTap,
    this.onEdit,
    this.onDelete,
  }) : super(key: key);
}
```

**Features**:

- Maintenance type icon
- Date and mileage
- Cost badge
- Service provider
- Status chip (Completed, Scheduled, Overdue)
- Expandable description

---

#### `MaintenanceTimeline`

**Location**: `packages/mobile/lib/widgets/maintenance_timeline.dart`

**Description**: Timeline view of maintenance history.

**Parameters**:

```dart
class MaintenanceTimeline extends StatelessWidget {
  final List<Maintenance> records;
  final Function(Maintenance)? onRecordTap;

  const MaintenanceTimeline({
    Key? key,
    required this.records,
    this.onRecordTap,
  }) : super(key: key);
}
```

**Usage**:

```dart
class MaintenanceHistoryScreen extends StatelessWidget {
  final String vehicleId;

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<List<Maintenance>>(
      stream: FirestoreService().getMaintenanceStream(vehicleId),
      builder: (context, snapshot) {
        if (!snapshot.hasData) return CircularProgressIndicator();

        return MaintenanceTimeline(
          records: snapshot.data!,
          onRecordTap: (record) => context.go('/maintenance/${record.id}'),
        );
      },
    );
  }
}
```

**Visual Layout**:

```
    │
    ├─⚫─ Oil Change (Jan 15, 2024)
    │    15,234 miles • $45.99
    │
    ├─⚫─ Tire Rotation (Oct 10, 2023)
    │    12,000 miles • $30.00
    │
    ├─⚫─ Brake Service (Jul 5, 2023)
    │    8,500 miles • $250.00
    │
```

---

### Form Components

#### `CustomTextField`

**Location**: `packages/mobile/lib/widgets/custom_text_field.dart`

**Description**: Styled text input field with validation.

**Parameters**:

```dart
class CustomTextField extends StatelessWidget {
  final String label;
  final String? hintText;
  final TextEditingController? controller;
  final String? Function(String?)? validator;
  final TextInputType? keyboardType;
  final bool obscureText;
  final Widget? prefixIcon;
  final Widget? suffixIcon;
  final int? maxLength;

  const CustomTextField({
    Key? key,
    required this.label,
    this.hintText,
    this.controller,
    this.validator,
    this.keyboardType,
    this.obscureText = false,
    this.prefixIcon,
    this.suffixIcon,
    this.maxLength,
  }) : super(key: key);
}
```

**Usage**:

```dart
final vinController = TextEditingController();

CustomTextField(
  label: 'VIN',
  hintText: 'Enter 17-character VIN',
  controller: vinController,
  keyboardType: TextInputType.text,
  maxLength: 17,
  validator: validateVIN,
  suffixIcon: IconButton(
    icon: Icon(Icons.qr_code_scanner),
    onPressed: () => scanVIN(),
  ),
)
```

---

#### `CustomButton`

**Location**: `packages/mobile/lib/widgets/custom_button.dart`

**Description**: Styled button with loading state.

**Parameters**:

```dart
class CustomButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final ButtonType type;
  final bool loading;
  final IconData? icon;

  const CustomButton({
    Key? key,
    required this.text,
    this.onPressed,
    this.type = ButtonType.primary,
    this.loading = false,
    this.icon,
  }) : super(key: key);
}

enum ButtonType {
  primary,
  secondary,
  danger,
  text,
}
```

**Usage**:

```dart
CustomButton(
  text: 'Save Vehicle',
  type: ButtonType.primary,
  icon: Icons.save,
  loading: isLoading,
  onPressed: () => handleSave(),
)
```

---

### Utility Components

#### `LoadingIndicator`

**Location**: `packages/mobile/lib/widgets/loading_indicator.dart`

**Description**: Centered circular progress indicator.

**Usage**:

```dart
if (isLoading) {
  return LoadingIndicator(message: 'Loading vehicles...');
}
```

---

#### `EmptyState`

**Location**: `packages/mobile/lib/widgets/empty_state.dart`

**Description**: Empty state placeholder with icon and message.

**Parameters**:

```dart
class EmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? message;
  final Widget? action;

  const EmptyState({
    Key? key,
    required this.icon,
    required this.title,
    this.message,
    this.action,
  }) : super(key: key);
}
```

**Usage**:

```dart
if (vehicles.isEmpty) {
  return EmptyState(
    icon: Icons.directions_car,
    title: 'No Vehicles',
    message: 'Add your first vehicle to get started',
    action: ElevatedButton(
      onPressed: () => context.go('/add-vehicle'),
      child: Text('Add Vehicle'),
    ),
  );
}
```

---

#### `ErrorView`

**Location**: `packages/mobile/lib/widgets/error_view.dart`

**Description**: Error state display with retry button.

**Parameters**:

```dart
class ErrorView extends StatelessWidget {
  final String message;
  final VoidCallback? onRetry;

  const ErrorView({
    Key? key,
    required this.message,
    this.onRetry,
  }) : super(key: key);
}
```

**Usage**:

```dart
if (snapshot.hasError) {
  return ErrorView(
    message: snapshot.error.toString(),
    onRetry: () => setState(() {}),  // Rebuild to retry
  );
}
```

---

## Component Guidelines

### Creating New Components

1. **Identify Reusability**:
   - Is this component used in multiple places?
   - Can it be abstracted to be more generic?

2. **Define Clear Interface**:
   - Document all props/parameters
   - Use TypeScript interfaces or Dart classes
   - Provide sensible defaults

3. **Handle Edge Cases**:
   - Loading states
   - Error states
   - Empty states
   - Null/undefined values

4. **Add Accessibility**:
   - Semantic HTML (web)
   - ARIA attributes (web)
   - Semantics widgets (Flutter)
   - Keyboard navigation support

5. **Test Component**:
   - Unit tests for logic
   - Component tests for rendering
   - Visual regression tests

### Component Checklist

```markdown
□ Clear, descriptive name
□ TypeScript/Dart types defined
□ Props/parameters documented
□ Usage example provided
□ Handles loading state
□ Handles error state
□ Handles empty state
□ Accessible (ARIA/Semantics)
□ Responsive (web)
□ Styled consistently
□ Unit tests written
□ Component tests written
□ Added to component library docs
```

---

## Styling Guide

### Web (Tailwind CSS)

#### Color Palette

```css
/* Primary Colors */
--primary-50: #eff6ff;
--primary-500: #3b82f6;
--primary-600: #2563eb;
--primary-700: #1d4ed8;

/* Gray Scale */
--gray-50: #f9fafb;
--gray-100: #f3f4f6;
--gray-500: #6b7280;
--gray-900: #111827;

/* Semantic Colors */
--success: #10b981;
--warning: #f59e0b;
--error: #ef4444;
--info: #3b82f6;
```

#### Spacing

Use Tailwind spacing scale (4px increments):

- `p-1` = 4px
- `p-2` = 8px
- `p-4` = 16px
- `p-6` = 24px
- `p-8` = 32px

#### Typography

```tsx
// Headings
<h1 className="text-4xl font-bold text-gray-900">Heading 1</h1>
<h2 className="text-3xl font-semibold text-gray-800">Heading 2</h2>
<h3 className="text-2xl font-medium text-gray-700">Heading 3</h3>

// Body
<p className="text-base text-gray-600">Body text</p>
<p className="text-sm text-gray-500">Small text</p>
```

#### Buttons

```tsx
// Primary
<button className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md shadow-sm">
  Primary Button
</button>

// Secondary
<button className="border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-md">
  Secondary Button
</button>

// Danger
<button className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md shadow-sm">
  Delete
</button>
```

#### Cards

```tsx
<div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
  <h3 className="text-xl font-semibold mb-2">Card Title</h3>
  <p className="text-gray-600">Card content</p>
</div>
```

---

### Mobile (Flutter Material Theme)

#### Theme Configuration

**Location**: `packages/mobile/lib/theme/app_theme.dart`

```dart
class AppTheme {
  static ThemeData lightTheme = ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(
      seedColor: Colors.blue,
      brightness: Brightness.light,
    ),
    appBarTheme: AppBarTheme(
      centerTitle: true,
      elevation: 0,
      backgroundColor: Colors.blue,
      foregroundColor: Colors.white,
    ),
    cardTheme: CardTheme(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        padding: EdgeInsets.symmetric(horizontal: 24, vertical: 12),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
      ),
      filled: true,
      fillColor: Colors.grey[50],
    ),
  );
}
```

#### Spacing

Use EdgeInsets with multiples of 4:

```dart
EdgeInsets.all(4)     // Extra small
EdgeInsets.all(8)     // Small
EdgeInsets.all(16)    // Medium
EdgeInsets.all(24)    // Large
EdgeInsets.all(32)    // Extra large
```

#### Typography

```dart
Text(
  'Heading 1',
  style: Theme.of(context).textTheme.headlineLarge,
)

Text(
  'Body text',
  style: Theme.of(context).textTheme.bodyMedium,
)

Text(
  'Caption',
  style: Theme.of(context).textTheme.bodySmall?.copyWith(
    color: Colors.grey[600],
  ),
)
```

---

## Accessibility

### Web Accessibility

#### Semantic HTML

```tsx
// ✅ Good: Semantic elements
<nav>
  <ul>
    <li><a href="/home">Home</a></li>
  </ul>
</nav>

<main>
  <article>
    <h1>Page Title</h1>
    <p>Content</p>
  </article>
</main>

// ❌ Bad: Generic divs
<div>
  <div>
    <div onClick={navigate}>Home</div>
  </div>
</div>
```

#### ARIA Attributes

```tsx
// Button with icon only
<button aria-label="Delete vehicle">
  <TrashIcon />
</button>

// Form input
<input
  type="text"
  aria-label="Vehicle VIN"
  aria-required="true"
  aria-invalid={!!error}
  aria-describedby="vin-error"
/>
{error && <span id="vin-error" role="alert">{error}</span>}

// Loading indicator
<div role="status" aria-live="polite">
  {loading && <span>Loading vehicles...</span>}
</div>
```

#### Keyboard Navigation

```tsx
// Ensure all interactive elements are keyboard accessible
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={e => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
>
  Click me
</div>
```

#### Focus Management

```tsx
// Focus first input on mount
const firstInputRef = useRef<HTMLInputElement>(null);

useEffect(() => {
  firstInputRef.current?.focus();
}, []);

return <input ref={firstInputRef} />;
```

---

### Mobile Accessibility

#### Semantics

```dart
// Add semantic labels
Semantics(
  label: 'Delete vehicle',
  button: true,
  child: IconButton(
    icon: Icon(Icons.delete),
    onPressed: handleDelete,
  ),
)

// Form field
Semantics(
  label: 'Vehicle VIN',
  textField: true,
  child: TextField(
    decoration: InputDecoration(labelText: 'VIN'),
  ),
)
```

#### Screen Reader Support

```dart
// Announce changes
LiveRegion(
  child: Text(isLoading ? 'Loading vehicles' : 'Vehicles loaded'),
)

// Exclude decorative elements
ExcludeSemantics(
  child: Image.asset('decorative-image.png'),
)
```

#### Focus Order

```dart
// Control focus order with FocusScope
FocusScope(
  child: Column(
    children: [
      TextField(), // Focus 1
      TextField(), // Focus 2
      TextField(), // Focus 3
    ],
  ),
)
```

---

## Appendix

### Component Development Workflow

1. **Plan**: Identify component need and define interface
2. **Design**: Create mockup or wireframe
3. **Implement**: Code the component with TypeScript/Dart types
4. **Style**: Apply consistent styling (Tailwind/Material)
5. **Accessibilize**: Add ARIA/Semantics attributes
6. **Test**: Write unit and component tests
7. **Document**: Add to this component library
8. **Review**: Code review and feedback
9. **Deploy**: Merge and deploy

### Testing Components

**Web (React Testing Library)**:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import Button from './Button';

test('renders button with text', () => {
  render(<Button>Click me</Button>);
  expect(screen.getByText('Click me')).toBeInTheDocument();
});

test('calls onClick when clicked', () => {
  const handleClick = jest.fn();
  render(<Button onClick={handleClick}>Click me</Button>);
  fireEvent.click(screen.getByText('Click me'));
  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

**Mobile (Flutter Widget Tests)**:

```dart
import 'package:flutter_test/flutter_test.dart';
import 'package:vehicle_vitals/widgets/custom_button.dart';

void main() {
  testWidgets('CustomButton displays text', (WidgetTester tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: CustomButton(text: 'Click me', onPressed: () {}),
        ),
      ),
    );

    expect(find.text('Click me'), findsOneWidget);
  });

  testWidgets('CustomButton calls onPressed', (WidgetTester tester) async {
    bool pressed = false;

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: CustomButton(
            text: 'Click me',
            onPressed: () => pressed = true,
          ),
        ),
      ),
    );

    await tester.tap(find.text('Click me'));
    expect(pressed, true);
  });
}
```

---

**Document Revision History**:

- **v1.0** (Feb 16, 2026): Initial component library documentation

**Maintained By**: Mark Nelson  
**Review Cycle**: Quarterly or when new components added  
**Next Review**: May 16, 2026  
**Feedback**: Create GitHub issue with "component" label
