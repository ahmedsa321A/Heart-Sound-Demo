# HeartAi API Documentation

## Overview
This document outlines the API endpoints for the HeartAi application.
- **Base URL (Backend)**: `http://localhost:3000`
- **Frontend Integration**:
  - All requests to protected routes must include `withCredentials: true` to send cookies.
  - Handle 401 errors globally to trigger the Refresh Token flow.

---

## 1. Authentication Module (`/auth`)

### 1.1 Register User
**Endpoint**: `POST /auth/register`

- **Request Body**:
  ```json
  {
    "fullName": "John Doe",
    "email": "john@example.com",
    "password": "securePassword123", // WARNING: Backend might bugnally expect hashPassword
    "age": 30,
    "gender": "male",
    "chronicCardiac": ["mi"]
  }
  ```

- **Success Response (200 OK)**:
  ```json
  { "msg": "Email sent. Please verify OTP." }
  ```

- **Error Responses**:
  - **400 Bad Request** (User already exists):
    ```json
    { "msg": "User already exists" }
    ```
  - **500 Server Error** (Email failure):
    ```json
    { "msg": "Email failed (check server console for OTP), but user created." }
    ```
  - **500 Server Error** (Crash):
    ```json
    "Server error"
    ```

### 1.2 Verify OTP
**Endpoint**: `POST /auth/verify`

- **Request Body**:
  ```json
  { "email": "john@example.com", "otp": "123456" }
  ```

- **Success Response (200 OK)**:
  ```json
  { "msg": "Account Verified! You can now login." }
  ```

- **Error Responses**:
  - **400 Bad Request** (Invalid Input):
    ```json
    { "msg": "Invalid OTP or OTP has expired" }
    ```
  - **500 Server Error**:
    ```json
    "Server error"
    ```

### 1.3 Login
**Endpoint**: `POST /auth/login`

- **Request Body**:
  ```json
  { "email": "john@example.com", "password": "securePassword123" }
  ```

- **Success Response (200 OK)**:
  - *Sets `token` and `refreshToken` cookies.*
  ```json
  {
    "success": true,
    "user": { "id": "...", "name": "...", "email": "..." },
    "msg": "Logged in successfully"
  }
  ```

- **Error Responses**:
  - **400 Bad Request** (Wrong Email/Password):
    ```json
    { "msg": "Invalid credentials" }
    ```
  - **400 Bad Request** (Unverified Email):
    ```json
    { "msg": "Please verify your email first" }
    ```
  - **500 Server Error**:
    ```json
    { "msg": "Server error" }
    ```

### 1.4 Logout
**Endpoint**: `POST /auth/logout`

- **Success Response (200 OK)**:
  - *Clears cookies.*
  ```json
  { "msg": "Logged out" }
  ```

### 1.5 Refresh Token
**Endpoint**: `POST /auth/refresh`
- *Called automatically when Access Token expires.*

- **Success Response (200 OK)**:
  - *Sets new cookies.*
  ```json
  { "success": true, "msg": "Token refreshed" }
  ```

- **Error Responses (401 Unauthorized)**:
  - Missing Token: `{ "msg": "No refresh token" }`
  - Reuse Detected: `{ "msg": "Refresh token reuse detected" }`
  - Invalid Token: `{ "msg": "Invalid refresh token" }`
  - *Action: Redirect user to Login page.*

---

## 2. Password Reset Flow

### 2.1 Request Reset
**Endpoint**: `POST /auth/forgot-password`

- **Body**: `{ "email": "..." }`
- **Error**:
  - **400**: `{ "msg": "Please verify your email first" }`
  - **200** (Even if email not found, for security): `{ "msg": "If that email exists, we sent a reset code." }`

### 2.2 Verify Reset OTP
**Endpoint**: `POST /auth/verify-reset-otp`

- **Body**: `{ "email": "...", "otp": "..." }`
- **Success (200)**:
  ```json
  { 
    "msg": "OTP verified successfully. You can now reset your password.",
    "expiresIn": 900
  }
  ```
- **Error (400)**: `{ "msg": "Invalid or expired OTP" }`

### 2.3 Set New Password
**Endpoint**: `POST /auth/reset-password`

- **Body**: `{ "newPassword": "..." }`
- **Error (400)**:
  - Missing Token: `{ "msg": "Reset token missing. Please verify OTP again." }`
  - Short Password: `{ "msg": "Password must be at least 8 characters" }`
  - Invalid Token: `{ "msg": "Invalid or expired reset token. Please request a new code." }`

---

## 3. Global Auth Middleware Errors
Any protected route (e.g., `/predictions/*`) may return these **401 Unauthorized** errors.

| status | Code | Message | Action |
| :--- | :--- | :--- | :--- |
| 401 | `NO_TOKEN` | "Not authorized, no token" | Redirect to Login |
| 401 | `TOKEN_REVOKED` | "Token revoked" | Redirect to Login |
| 401 | `USER_NOT_FOUND` | "User not found" | Redirect to Register |
| 401 | `TOKEN_EXPIRED` | "Token expired" | **Call `/auth/refresh`** |
| 401 | `INVALID_TOKEN` | "Invalid token" | Redirect to Login |
| 401 | `AUTH_FAILED` | "Not authorized, token failed" | Redirect to Login |

---

## 4. Predictions Module (Pending)

### 4.1 Make Prediction
**Endpoint**: `POST /predictions/makePrediction`

- **Errors**:
  - **500**: `{ "message": "AI Service Error" }` (If Python service is down or fails)
  
### 4.2 Get History
**Endpoint**: `GET /predictions/getPredictions`

- **Errors**:
  - **404**: `{ "message": "User not found" }`

---

## 5. Frontend Token Handling Guide (Critical)

### 5.1 The "Interceptor" Strategy
The frontend uses **HttpOnly Cookies** for security. You cannot read the tokens in JavaScript. Instead, you must rely on HTTP status codes.

**Recommended Axios Interceptor Logic:**

```javascript
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Case 1: Access Token Expired (401 + specific code)
    // The backend sends code: 'TOKEN_EXPIRED' when the short-lived token dies.
    if (error.response?.status === 401 && error.response?.data?.code === 'TOKEN_EXPIRED' && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // 1. Attempt to refresh
        await axios.post('http://localhost:3000/auth/refresh', {}, { withCredentials: true });
        
        // 2. Retry the original request (cookies are automatically sent)
        return axios(originalRequest);
      } catch (refreshError) {
        // 3. Refresh failed? Session is dead. Force Logout.
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Case 2: Invalid/Missing Token (401 + other codes)
    // Examples: NO_TOKEN, USER_NOT_FOUND, INVALID_TOKEN
    // These mean the user is not logged in or the token is garbage.
    if (error.response?.status === 401 && error.response?.data?.code !== 'TOKEN_EXPIRED') {
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);
```

### 5.2 Summary of Actions

| HTTP Status | Error Code (Body) | Meaning | Frontend Action |
| :--- | :--- | :--- | :--- |
| **200-299** | - | Success | Render Data |
| **401** | `TOKEN_EXPIRED` | Access Token expired (15m) | **Call `/refresh` endpoint.** If success, retry original req. |
| **401** | `NO_TOKEN` | No cookie sent | **Redirect to Login** |
| **401** | `INVALID_TOKEN` | Tampered cookie | **Redirect to Login** |
| **401** | `TOKEN_REVOKED` | User logged out elsewhere | **Redirect to Login** |
| **401** | `AUTH_FAILED` | Generic failure | **Redirect to Login** |
| **403** | - | Forbidden (Permissions) | Show "Access Denied" toast |

