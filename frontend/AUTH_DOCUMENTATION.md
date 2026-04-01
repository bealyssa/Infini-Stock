# Authentication System - Login & Sign Up Pages

## Overview
Professional Login and Sign Up pages with animated ShapeGrid background, built with your dark design system (#171717 bg, #404040 borders).

---

## ✨ Features

### Login Page
- Email and password authentication
- Beautiful ShapeGrid animated background
- Error handling and loading states
- Demo credentials hint
- Sign Up link for new users
- Responsive design

### Sign Up Page
- Full name, email, password fields
- Role selection (Viewer, Staff, Technician, Manager, Admin)
- Password confirmation validation
- Error handling and loading states
- Sign In link for existing users
- Responsive design

### Design Elements
- **Background**: Animated ShapeGrid (diagonal squares, #404040 borders)
- **Card**: Dark themed (#171717/95 with backdrop blur)
- **Colors**: Pure white text, gray accents, error/success highlights
- **Icons**: LogIn, UserPlus from lucide-react
- **Animations**: Smooth transitions, hover states

---

## 🎯 File Structure

```
frontend/src/
├── pages/
│   ├── Login.jsx          ← Login page
│   └── SignUp.jsx         ← Sign up page
├── components/
│   ├── ShapeGrid.jsx      ← Animated background component
│   └── Header.jsx         ← Updated with user info & logout
├── api/
│   └── index.js           ← Updated with authApi methods
└── App.jsx                ← Updated with auth routing
```

---

## 🔐 Authentication Flow

### 1. User Registration (Sign Up)

```javascript
// Frontend
POST /api/auth/register
{
  "full_name": "John Technician",
  "email": "john@infocom.com",
  "password": "secure-pass",
  "role": "technician"
}

// Response
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid",
    "email": "john@infocom.com",
    "full_name": "John Technician",
    "role": "technician"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}

// Frontend stores
localStorage.setItem('authToken', token)
localStorage.setItem('user', JSON.stringify(user))
```

### 2. User Login

```javascript
// Frontend
POST /api/auth/login
{
  "email": "john@infocom.com",
  "password": "secure-pass"
}

// Response
Same as registration response
```

### 3. Protected Routes

```javascript
// App.jsx checks for token
const isAuthenticated = !!localStorage.getItem('authToken')

// Public routes: /login, /signup
// Protected routes: /, /units, /monitors, /qr-generator, /logs
```

### 4. User Logout

```javascript
// Button in Header.jsx
handleLogout = () => {
  localStorage.removeItem('authToken')
  localStorage.removeItem('user')
  navigate('/login')
}
```

---

## 🧪 Testing

### Test Account (Pre-created via backend)
```
Email: tech@infocom.com
Password: tech-pass-123
Role: technician
```

### Registration Flow
1. Click "Create Account" on login page
2. Fill in form with:
   - Full Name: "Test User"
   - Email: "test@example.com"
   - Role: "technician"
   - Password: "test-pass-123"
3. Submit and redirect to dashboard

### Login Flow
1. Enter credentials
2. Submit form
3. Token saved to localStorage
4. Redirect to dashboard

### Logout Flow
1. Click "Logout" button (top right)
2. Tokens cleared from localStorage
3. Redirect to login page

---

## 🎨 Component Details

### ShapeGrid.jsx
Animated canvas-based background with customizable:
- **direction**: 'diagonal' | 'up' | 'down' | 'left' | 'right'
- **speed**: Animation speed (0.1-2.0)
- **shape**: 'square' | 'hexagon' | 'circle' | 'triangle'
- **squareSize**: Grid cell size in pixels
- **borderColor**: Border hex color (#404040)
- **hoverFillColor**: Hover effect color (#262626)

**Usage:**
```jsx
<ShapeGrid
  speed={0.5}
  squareSize={40}
  direction="diagonal"
  borderColor="#404040"
  hoverFillColor="#262626"
  shape="square"
/>
```

### Login.jsx
**Props**: None  
**State**: 
- `formData` - email, password
- `loading` - API call state
- `error` - Error message

**Key Features**:
- Form validation
- Error display
- Loading state handling
- Demo credentials hint
- Responsive layout

### SignUp.jsx
**Props**: None  
**State**:
- `formData` - full_name, email, password, confirmPassword, role
- `loading` - API call state
- `error` - Error message

**Key Features**:
- Password confirmation check
- Role selection dropdown
- Minimum password length validation
- Role info helper
- Responsive layout

### Header.jsx (Updated)
**New Features**:
- User name display
- User role display (capitalized)
- Logout button with icon
- Styled with red theme for logout
- Responsive design

---

## 🔑 API Integration

### Auth Endpoints

#### Register
```bash
POST /api/auth/register
Content-Type: application/json

{
  "full_name": "string",
  "email": "string",
  "password": "string",
  "role": "staff|technician|manager|admin|viewer" (optional, defaults to 'staff')
}
```

#### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "string",
  "password": "string"
}
```

#### Get Current User
```bash
GET /api/auth/me
Authorization: Bearer <token>
```

### Error Responses

```json
{
  "message": "Invalid email or password"
}
```

```json
{
  "message": "User already exists"
}
```

```json
{
  "message": "Missing required fields"
}
```

---

## 🎯 User Flow Diagram

```
User Visits App
    ↓
Check localStorage for token
    ├─ Token exists → Dashboard
    └─ No token → Login Page

Login/SignUp Form
    ↓
Submit Credentials
    ↓
Backend Auth
    ├─ Success → Get JWT Token
    │    ↓
    │    Store in localStorage
    │    ↓
    │    Redirect to Dashboard
    │
    └─ Error → Show Error Message

Dashboard
    ↓
Display User Info (Header)
    ↓
Logout Button → Clear localStorage → Login Page
```

---

## 🛡️ Security Notes

### Current Implementation (Development)
- JWT tokens stored in localStorage
- Bearer token in Authorization header
- 7-day token expiration
- Password stored as-is (demo only)

### Production Recommendations
1. **Use httpOnly cookies** instead of localStorage for tokens
2. **Hash passwords** with bcrypt before storing
3. **Add CSRF protection**
4. **Use HTTPS only**
5. **Add email verification** for new accounts
6. **Implement refresh tokens** for better security
7. **Add rate limiting** on auth endpoints
8. **Log authentication attempts** for audit trails

---

## 🚧 Future Enhancements

1. **Two-Factor Authentication (2FA)**
   - SMS or email OTP verification
   - TOTP app integration

2. **Social Login**
   - Google OAuth
   - Microsoft OAuth

3. **Password Management**
   - Forgot password flow
   - Password reset email

4. **Profile Management**
   - Edit user profile
   - Change password
   - Profile picture upload

5. **Session Management**
   - Multiple device sessions
   - Session timeout warning
   - Logout all devices

6. **Advanced Security**
   - Login attempt tracking
   - IP whitelisting
   - Device fingerprinting

---

## 📋 Testing Checklist

- [ ] Login with valid credentials
- [ ] Login with invalid credentials (shows error)
- [ ] Sign up with new email
- [ ] Sign up with conflicting email (shows error)
- [ ] Password confirmation validation
- [ ] Minimum password length check
- [ ] Logout clears localStorage
- [ ] Can't access dashboard without token
- [ ] ShapeGrid background animates
- [ ] Responsive on mobile
- [ ] Form inputs are properly validated
- [ ] State loading indicators work
- [ ] User info displays correctly in Header
- [ ] Role selection works

---

## 🐛 Troubleshooting

### Token Not Persisting
Check if localStorage is cleared by browser extensions or cache clearing.

### CORS Errors
Ensure backend CORS configuration includes frontend URL:
```javascript
const allowedOrigins = ['http://localhost:5173']
```

### ShapeGrid Not Displaying
Verify canvas element is rendered and body has proper dimensions.

### Login Redirect Loop
Check that token is properly stored in localStorage and not being cleared.

### Form Not Submitting
Verify form fields match API requirements (full_name not fullName, etc.)

---

## 📞 Support

For issues or questions:
1. Check console for error messages
2. Verify backend is running on port 5000
3. Check network tab in DevTools
4. Review backend logs for API errors
