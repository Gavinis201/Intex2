# Environment Variables Setup

This application uses environment variables to store sensitive information like database connection strings and JWT secrets. Follow these steps to set up your environment:

## Local Development Setup

1. Copy the `.env.example` file to a new file named `.env` in the project root:
   ```
   cp .env.example .env
   ```

2. Edit the `.env` file and fill in your actual credentials:
   ```
   # Database Connection
   MOVIE_CONNECTION_STRING=Data Source=Movies.sqlite

   # JWT Authentication
   JWT_SECRET=YourSecureRandomString
   JWT_VALID_AUDIENCE=http://localhost:3000
   JWT_VALID_ISSUER=http://localhost:5000

   # Application Settings
   PORT=5000
   ```

3. Make sure to generate a strong, random string for the JWT_SECRET. You can use an online generator or run this command in your terminal:
   ```bash
   openssl rand -base64 32
   ```

4. **IMPORTANT**: Never commit your `.env` file to source control. It's already added to `.gitignore`.

## Production Deployment

For production environments, set the environment variables directly on your hosting platform:

- **Azure**: Use Application Settings in the Azure Portal
- **AWS**: Use Environment Properties in Elastic Beanstalk or Parameter Store
- **Heroku**: Use Config Vars in the Heroku Dashboard

## Available Environment Variables

| Variable | Description | Default Value |
|----------|-------------|---------------|
| MOVIE_CONNECTION_STRING | SQLite database connection string | Data Source=Movies.sqlite |
| JWT_SECRET | Secret key for JWT token generation | (none - must be set) |
| JWT_VALID_AUDIENCE | JWT audience validation | http://localhost:3000 |
| JWT_VALID_ISSUER | JWT issuer validation | http://localhost:5000 |
| PORT | Application port | 5000 | 