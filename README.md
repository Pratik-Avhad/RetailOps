# RetailOps - Retail Inventory Management System

A comprehensive retail inventory management system built with Node.js, Express, MongoDB, and Google OAuth authentication.

## Features

- 🔐 **Google OAuth Authentication** - Secure login with Google accounts
- 📦 **Inventory Management** - Add, view, and search inventory items
- 📊 **Dashboard** - Real-time inventory insights and low stock alerts
- 🏷️ **Category Management** - Organize products by categories
- 🔍 **Search Functionality** - Find products quickly


## Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** MongoDB with Mongoose
- **Authentication:** Passport.js with Google OAuth 2.0
- **Frontend:** EJS templating with Bootstrap
- **Session Management:** Express-session

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (running locally or cloud instance)
- Google Developer Account

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd RetailOps
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Google OAuth Credentials**

   a. Go to [Google Cloud Console](https://console.cloud.google.com/)
   b. Create a new project or select existing one
   c. Enable Google+ API (still needed for basic OAuth authentication)
   d. Go to "APIs & Services" → "Credentials"
   e. Click "Create Credentials" → "OAuth 2.0 Client IDs"
   f. Set Application Type to "Web application"
   g. Add authorized redirect URIs:
      - `http://localhost:8080/auth/google/callback` (for development)
      - `https://yourdomain.com/auth/google/callback` (for production)
   h. Copy the Client ID and Client Secret

4. **Configure Environment Variables**

   Copy `env.example` to `.env` and fill in your credentials:
   ```bash
   cp env.example .env
   ```

   Edit `.env` file:
   ```env
   GOOGLE_CLIENT_ID=your_google_client_id_here
   GOOGLE_CLIENT_SECRET=your_google_client_secret_here
   SESSION_SECRET=your_random_session_secret
   MONGODB_URI=mongodb://127.0.0.1:27017/RetailOps
   PORT=8080
   ```

5. **Start MongoDB**
   ```bash
   # Make sure MongoDB is running
   mongod
   ```

6. **Run the application**
   ```bash
   npm run dev
   ```

7. **Access the application**
   Open your browser and go to `http://localhost:8080`

## Usage

### Authentication
- Click "Sign in with Google" on the home page
- Authorize the application with your Google account
- You'll be redirected to the dashboard after successful authentication

### Inventory Management
- **View Inventory:** Navigate to `/inventory` to see all products
- **Add Products:** Go to `/inventory/new` to add new items
- **Search:** Use the search bar to find specific products
- **Categories:** Filter products by category using the dropdown

### Dashboard
- **Low Stock Alerts:** View items with quantity less than 10
- **Quick Actions:** Click on low stock items to update them



## API Endpoints

### Authentication
- `GET /auth/google` - Initiate Google OAuth
- `GET /auth/google/callback` - OAuth callback
- `GET /logout` - Logout user

### Inventory
- `GET /inventory` - View all inventory (requires auth)
- `GET /inventory/new` - Add new inventory form (requires auth)
- `POST /inventory` - Add new inventory items (requires auth)
- `GET /inventory/:category` - View inventory by category (requires auth)
- `GET /inventory/check` - Check if product exists (requires auth)

### Dashboard
- `GET /dashboard` - View dashboard (requires auth)

## Project Structure

```
RetailOps/
├── app.js                 # Main application file
├── config/
│   ├── config.js         # Configuration settings
│   └── passport.js       # Passport authentication setup
├── middlewares/
│   ├── auth.js           # Authentication middleware
│   └── dashboard.js      # Dashboard middleware
├── models/
│   ├── item.js           # Inventory item model
│   └── user.js           # User model
├── views/
│   ├── dashboard/        # Dashboard views
│   ├── inventory/        # Inventory views
│   ├── includes/         # Shared components
│   └── layouts/          # Layout templates
└── package.json
```

## Security Features

- **OAuth 2.0 Authentication** - Secure Google login
- **Session Management** - Secure session handling

- **Input Validation** - Server-side validation
- **CSRF Protection** - Built-in Express security

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the ISC License.

## Support

For support, please open an issue in the GitHub repository. 