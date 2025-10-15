# FishTimes - Mobile Fishing App

A comprehensive mobile fishing app built with React Native and Supabase that helps anglers track their catches, get weather-based fishing forecasts, and build a digital trophy room.

## Features

### 🏠 Home Tab
- Quick overview of today's fishing conditions
- Current weather data with fishing activity rating
- Recent activity preview
- Quick action buttons

### 🌤️ Weather Tab
- Detailed weather conditions and forecasts
- Solunar data (sunrise/sunset, moon phases)
- Tide information for coastal fishing
- 7-day fishing forecast
- Fishing tips and recommendations

### 🏆 Trophy Room Tab
- Pokemon-style collection system for fish species
- Regional fish species database
- Personal catch statistics
- Rarity system (Common, Uncommon, Rare, Legendary)
- Filter by caught/uncaught and water type

### 👥 Social Tab
- Share catches with friends and community
- Follow other anglers
- Like and comment on catches
- Nearby catches feed
- Privacy controls (Public, Friends, Private)

### 📝 Log Catch Tab
- Photo upload with camera or gallery
- Species selection with auto-suggestions
- Weight and length measurements
- Bait used tracking
- Location tagging
- Notes and privacy settings

### 👤 Profile Tab
- Personal fishing statistics
- Achievement system
- Personal records tracking
- Settings and preferences

## Tech Stack

- **Frontend**: React Native with Expo
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Navigation**: React Navigation 6
- **State Management**: React Context + Hooks
- **Weather APIs**: OpenWeatherMap + Solunar API
- **Maps**: React Native Maps
- **Image Handling**: Expo Image Picker

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- Supabase account

### 1. Clone and Install Dependencies
```bash
git clone <repository-url>
cd fish_app
npm install
```

### 2. Supabase Setup
1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and anon key
3. Update `src/constants/config.ts` with your Supabase credentials:
```typescript
export const SUPABASE_URL = 'your-supabase-url';
export const SUPABASE_ANON_KEY = 'your-supabase-anon-key';
```

### 3. Database Setup
Run the SQL migrations in your Supabase SQL editor:
1. Copy and run `supabase/migrations/001_initial_schema.sql`
2. Copy and run `supabase/migrations/002_seed_data.sql`

### 4. Weather API Setup
1. Get an API key from [OpenWeatherMap](https://openweathermap.org/api)
2. Update `src/constants/config.ts`:
```typescript
export const WEATHER_API_KEY = 'your-openweather-api-key';
```

### 5. Storage Setup
In your Supabase dashboard:
1. Go to Storage
2. Create a new bucket called `catch-photos`
3. Set it to public

### 6. Run the App
```bash
npm start
```

## Project Structure

```
fish_app/
├── src/
│   ├── components/          # Reusable UI components
│   ├── screens/             # App screens
│   │   ├── auth/           # Authentication screens
│   │   └── main/           # Main app screens
│   ├── services/           # API services
│   ├── context/            # React Context providers
│   ├── navigation/         # Navigation setup
│   ├── constants/          # App constants
│   └── utils/              # Helper functions
├── supabase/              # Database migrations
├── assets/                # Images, icons, fonts
└── App.tsx               # Main app component
```

## Key Features Implementation

### Authentication
- Supabase Auth integration
- User registration and login
- Profile management

### Weather Integration
- Real-time weather data
- Fishing condition calculations
- Solunar and tide data
- 7-day forecasts

### Trophy Room System
- Species collection with rarity system
- Personal catch statistics
- Regional fish database
- Filter and search functionality

### Social Features
- Friend system
- Catch sharing with privacy controls
- Activity feeds
- Like and comment system

### Catch Logging
- Photo upload with compression
- Detailed catch information
- Location tagging
- Weather data correlation

## Database Schema

The app uses the following main tables:
- `users` - User profiles
- `fish_species` - Fish species database
- `catches` - User catch records
- `weather_forecasts` - Weather data
- `spots` - Fishing locations
- `friendships` - User relationships
- `notifications` - User notifications
- `achievements` - User achievements

## Future Enhancements

- AI fish species recognition
- Predictive hot spot mapping
- Collaborative challenges
- Bait effectiveness tracking
- Offline mode support
- Push notifications
- Advanced analytics

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
