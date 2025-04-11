# FutureLens Survey Application - File Structure

## Root Directory
- `src/` - Main source code directory
- `.env` - Environment variables (Supabase credentials)
- `package.json` - Node.js dependencies
- `server.js` - Express server configuration
- `FILE_STRUCTURE.md` - This document

## src/ Directory
- `index.html` - Main application entry point
- `results.html` - Survey completion page
- `test-offline.html` - Offline testing page
- `survey.js` - Main survey functionality
- `auth.js` - Authentication handling
- `supabase.js` - Supabase client configuration
- `test/` - Test files directory

## Key Files and Their Purposes

### HTML Files
- `index.html`: Main survey interface
- `results.html`: Success page shown after survey completion
- `test-offline.html`: Testing interface for offline functionality

### JavaScript Files
- `survey.js`: Core survey logic, question handling, and submission
- `auth.js`: User authentication and session management
- `supabase.js`: Supabase client initialization and configuration

### Configuration Files
- `.env`: Contains Supabase credentials and other environment variables
- `server.js`: Express server setup for local development

## Development Server
The application is served using Python's built-in HTTP server:
```bash
cd src && python3 -m http.server 8000
```

Access the application at: http://localhost:8000 