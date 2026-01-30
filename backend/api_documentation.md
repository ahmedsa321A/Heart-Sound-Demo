# CardioLens API Documentation

Base URL: `http://localhost:3000`

## Authentication

### 1. Register User
Creates a new user account and sends an OTP to the provided email.

- **URL**: `/auth/register`
- **Method**: `POST`
- **Content-Type**: `application/json`

#### Request Body
```json
{
  "fullName": "John Doe",
  "email": "johndoe@example.com",
  "password": "securePassword123",
  "age": 30,
  "gender": "male",
  "familyHistory": "yes",
  "hypertension": "no",
  "diabetes": "no",
  "renalPathologies": "no",
  "chronicCardiac": ["mi", "heart-failure"]
}
```

#### Success Response (200 OK)
```json
{
  "msg": "Email sent. Please verify OTP."
}
```
*Note: In Dev Mode, check the server console for the OTP.*

---

### 2. Verify OTP
Verifies the email address using the OTP sent/logged.

- **URL**: `/auth/verify`
- **Method**: `POST`
- **Content-Type**: `application/json`

#### Request Body
```json
{
  "email": "johndoe@example.com",
  "otp": "123456"
}
```

#### Success Response (200 OK)
```json
{
  "msg": "Account Verified! You can now login."
}
```

---

### 3. Login User
Authenticates a user and returns a JWT token. Also sets an `httpOnly` cookie named `token`.

- **URL**: `/auth/login`
- **Method**: `POST`
- **Content-Type**: `application/json`

#### Request Body
```json
{
  "email": "johndoe@example.com",
  "password": "securePassword123"
}
```

#### Success Response (200 OK)
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI...",
  "user": {
    "id": "679...abc",
    "fullName": "John Doe",
    "email": "johndoe@example.com",
    "age": 30,
    "gender": "Male"
  },
  "msg": "Logged in successfully",
  "success": true
}
```
*Cookies*: `token=eyJhbG...; HttpOnly; Path=/`

---

### 4. Logout User
Clears the authentication cookie.

- **URL**: `/auth/logout`
- **Method**: `POST`

#### Success Response (200 OK)
```json
{
  "success": true,
  "msg": "User logged out"
}
```

## Environment Configuration
Create a `.env` file in the `backend/` directory with the following variables:

```ini
PORT=3000
DB_URL_LOCAL=mongodb://localhost:27017/heart-sound-db

# Email Configuration (Nodemailer)
# Use a Gmail App Password, NOT your regular password.
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_16_char_app_password

# JWT Secrets
JWT_SECRET=your_super_secret_key_change_me
```
