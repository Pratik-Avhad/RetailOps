require('dotenv').config();

module.exports = {
  google: {
    clientID: process.env.GOOGLE_CLIENT_ID || 'your_google_client_id_here',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'your_google_client_secret_here',
  },
  session: {
    secret: process.env.SESSION_SECRET || 'your_session_secret_here',
  },
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/RetailOps',
  },
  port: process.env.PORT || 8080,
}; 