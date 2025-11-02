# Dating App Mobile (React Native/Expo)

A React Native mobile application for the dating app backend, built with Expo and React Navigation.

## Features

- **Authentication**: Login and registration with JWT tokens
- **User Profiles**: View and edit user profile information
- **Photo Management**: Upload, view, and delete profile photos
- **Modern UI**: Clean, responsive design with proper loading states
- **Secure Storage**: JWT tokens stored securely with AsyncStorage
- **Error Handling**: Comprehensive error handling and user feedback
- **Form Validation**: Client-side validation for all forms

## Screens

### 1. Login Screen
- Email and password input fields
- Login button with loading state
- Link to registration screen
- Form validation and error handling

### 2. Registration Screen
- Complete registration form with all required fields:
  - Email, password, confirm password
  - Name, age, gender selection
  - Bio (optional)
- Gender selection with visual feedback
- Form validation including age verification (18+)
- Auto-login after successful registration

### 3. Profile Screen
- Display user's complete profile information
- Avatar with user's initial
- All profile details including bio, location, photos, preferences
- **Photo gallery**: Grid display of uploaded photos
- Account information (member since, status, etc.)
- Edit profile button and logout functionality

### 4. Edit Profile Screen
- Update user information (name, age, gender, bio, location)
- Gender selection with current selection highlighted
- Location coordinates input (optional)
- **Photo management**:
  - Add photos from device gallery
  - Upload photos to backend with progress indication
  - View uploaded photos in thumbnail grid
  - Delete photos with confirmation dialog
- Form validation and error handling
- Save changes with loading state

## Technical Implementation

### Authentication Flow
- JWT token-based authentication
- Automatic token storage and retrieval
- Token expiration handling
- Secure API calls with authorization headers

### Navigation
- React Navigation Stack Navigator
- Authentication-based navigation (auth stack vs app stack)
- Modal presentation for edit profile screen
- Proper back navigation handling

### State Management
- React Context for authentication state
- Local state management for forms
- Loading states for all async operations

### API Integration
- Axios for HTTP requests
- Base URL configuration for backend
- Automatic authorization header injection
- Error handling with user-friendly messages
- **Photo upload**: FormData multipart uploads
- **Image handling**: Expo ImagePicker integration

## Photo Management Features

### Upload Process
- **Gallery Access**: Request permissions and select photos
- **Image Processing**: Automatic resizing and optimization
- **Upload Progress**: Loading indicators during upload
- **Error Handling**: Comprehensive error messages

### Photo Display
- **Grid Layout**: Responsive photo grid in profile view
- **Thumbnail View**: Optimized image display in edit screen
- **Delete Functionality**: Confirmation dialogs for photo deletion
- **Real-time Updates**: Immediate UI updates after operations

### Technical Details
- **File Format**: JPEG/PNG support
- **Size Limits**: Backend handles 5MB max file size
- **Image Optimization**: Automatic resizing to 1200px max width
- **URL Handling**: Automatic conversion of relative to absolute URLs

## Setup Instructions

1. **Install Dependencies**
   ```bash
   cd mobile-app
   npm install
   ```

2. **Start the Backend**
   ```bash
   cd ../backend
   uvicorn main:app --reload
   ```

3. **Start the Mobile App**
   ```bash
   cd mobile-app
   npm start
   ```

4. **Run on Device/Simulator**
   - Scan QR code with Expo Go app (physical device)
   - Press 'i' for iOS simulator
   - Press 'a' for Android emulator

## Configuration

### Backend URL
The app is configured to connect to `http://localhost:8000` by default. To change this:

1. Update the `API_BASE_URL` in `contexts/AuthContext.tsx`
2. For physical devices, use your computer's IP address instead of localhost

### Environment Variables
For production, consider using environment variables for:
- API base URL
- JWT secret key (backend)
- Other configuration values

## Project Structure

```
mobile-app/
├── App.tsx                 # Main app component with navigation
├── contexts/
│   └── AuthContext.tsx    # Authentication context and API client
├── screens/
│   ├── LoginScreen.tsx     # Login form
│   ├── RegisterScreen.tsx  # Registration form
│   ├── ProfileScreen.tsx   # User profile display
│   └── EditProfileScreen.tsx # Profile editing
└── package.json           # Dependencies and scripts
```

## Key Dependencies

- **@react-navigation/native**: Navigation framework
- **@react-navigation/stack**: Stack navigator
- **@react-native-async-storage/async-storage**: Secure token storage
- **axios**: HTTP client for API calls
- **expo-image-picker**: Photo selection from device gallery
- **expo**: Development platform and tools

## Security Features

- Password hashing (handled by backend)
- JWT token authentication
- Secure token storage
- Input validation and sanitization
- HTTPS support (in production)

## Error Handling

- Network error handling
- Form validation errors
- Authentication errors
- User-friendly error messages
- Loading states for better UX

## Future Enhancements

- Push notifications
- Real-time messaging
- Location services integration
- Advanced matching algorithms
- Social features (likes, matches, etc.)
- Photo filters and editing
- Multiple photo selection
- Photo reordering