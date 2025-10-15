-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    profile_pic TEXT,
    location TEXT,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fish species table
CREATE TABLE public.fish_species (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    scientific_name TEXT,
    region TEXT NOT NULL,
    photo_url TEXT,
    description TEXT,
    habitat TEXT,
    feeding_habits TEXT,
    best_baits TEXT[],
    legal_size_limit DECIMAL,
    rarity TEXT CHECK (rarity IN ('common', 'uncommon', 'rare', 'legendary')) DEFAULT 'common',
    water_type TEXT CHECK (water_type IN ('freshwater', 'saltwater', 'estuary')) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Catches table
CREATE TABLE public.catches (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    species_id UUID REFERENCES public.fish_species(id) ON DELETE CASCADE NOT NULL,
    photo_url TEXT,
    weight DECIMAL,
    length DECIMAL,
    bait_used TEXT,
    location TEXT,
    coordinates POINT,
    time TIME NOT NULL,
    date DATE NOT NULL,
    weather_data JSONB,
    privacy TEXT CHECK (privacy IN ('public', 'friends', 'private')) DEFAULT 'public',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Weather forecasts table
CREATE TABLE public.weather_forecasts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    location TEXT NOT NULL,
    coordinates POINT NOT NULL,
    date DATE NOT NULL,
    pressure DECIMAL NOT NULL,
    wind_speed DECIMAL NOT NULL,
    wind_direction DECIMAL NOT NULL,
    temperature DECIMAL NOT NULL,
    humidity DECIMAL NOT NULL,
    cloud_cover DECIMAL NOT NULL,
    solunar_data JSONB,
    tide_data JSONB,
    fishing_rating INTEGER CHECK (fishing_rating >= 1 AND fishing_rating <= 10) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fishing spots table
CREATE TABLE public.spots (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    coordinates POINT NOT NULL,
    notes TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Friends/followers table
CREATE TABLE public.friendships (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    follower_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    following_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(follower_id, following_id)
);

-- Notifications table
CREATE TABLE public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    message TEXT NOT NULL,
    type TEXT CHECK (type IN ('catch', 'friend', 'achievement', 'weather')) NOT NULL,
    data JSONB,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Achievements table
CREATE TABLE public.achievements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User catches summary (materialized view for performance)
CREATE MATERIALIZED VIEW public.user_catch_summary AS
SELECT 
    u.id as user_id,
    u.username,
    COUNT(c.id) as total_catches,
    COUNT(DISTINCT c.species_id) as species_count,
    AVG(c.weight) as avg_weight,
    MAX(c.weight) as max_weight,
    MIN(c.weight) as min_weight,
    AVG(c.length) as avg_length,
    MAX(c.length) as max_length,
    MIN(c.length) as min_length
FROM public.users u
LEFT JOIN public.catches c ON u.id = c.user_id
GROUP BY u.id, u.username;

-- Create indexes for better performance
CREATE INDEX idx_catches_user_id ON public.catches(user_id);
CREATE INDEX idx_catches_species_id ON public.catches(species_id);
CREATE INDEX idx_catches_date ON public.catches(date);
CREATE INDEX idx_catches_location ON public.catches USING GIST(coordinates);
CREATE INDEX idx_weather_forecasts_location ON public.weather_forecasts USING GIST(coordinates);
CREATE INDEX idx_weather_forecasts_date ON public.weather_forecasts(date);
CREATE INDEX idx_spots_user_id ON public.spots(user_id);
CREATE INDEX idx_spots_coordinates ON public.spots USING GIST(coordinates);
CREATE INDEX idx_friendships_follower ON public.friendships(follower_id);
CREATE INDEX idx_friendships_following ON public.friendships(following_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);

-- Row Level Security (RLS) policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

-- Users can read all public profiles
CREATE POLICY "Users can read all profiles" ON public.users
    FOR SELECT USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Catches policies
CREATE POLICY "Users can read public catches" ON public.catches
    FOR SELECT USING (privacy = 'public' OR 
                     (privacy = 'friends' AND user_id IN (
                         SELECT following_id FROM public.friendships WHERE follower_id = auth.uid()
                     )) OR 
                     user_id = auth.uid());

CREATE POLICY "Users can insert own catches" ON public.catches
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own catches" ON public.catches
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own catches" ON public.catches
    FOR DELETE USING (auth.uid() = user_id);

-- Spots policies
CREATE POLICY "Users can read public spots" ON public.spots
    FOR SELECT USING (is_public = true OR user_id = auth.uid());

CREATE POLICY "Users can manage own spots" ON public.spots
    FOR ALL USING (auth.uid() = user_id);

-- Friendships policies
CREATE POLICY "Users can manage own friendships" ON public.friendships
    FOR ALL USING (auth.uid() = follower_id);

-- Notifications policies
CREATE POLICY "Users can read own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Achievements policies
CREATE POLICY "Users can read all achievements" ON public.achievements
    FOR SELECT USING (true);

CREATE POLICY "System can insert achievements" ON public.achievements
    FOR INSERT WITH CHECK (true);

-- Functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, username, email)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'username', NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to refresh user catch summary
CREATE OR REPLACE FUNCTION public.refresh_user_catch_summary()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW public.user_catch_summary;
END;
$$ LANGUAGE plpgsql;

-- Trigger to refresh summary when catches change
CREATE OR REPLACE FUNCTION public.trigger_refresh_catch_summary()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.refresh_user_catch_summary();
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER refresh_catch_summary_on_catch_change
    AFTER INSERT OR UPDATE OR DELETE ON public.catches
    FOR EACH STATEMENT EXECUTE FUNCTION public.trigger_refresh_catch_summary();
