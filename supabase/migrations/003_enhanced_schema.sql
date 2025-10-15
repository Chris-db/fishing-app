-- Enhanced schema for comprehensive fishing app features

-- Add additional columns to existing tables
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS 
    bio TEXT,
    location_coordinates POINT,
    timezone TEXT DEFAULT 'UTC',
    notification_settings JSONB DEFAULT '{"catch_notifications": true, "weather_alerts": true, "friend_activity": true, "achievements": true}',
    privacy_settings JSONB DEFAULT '{"profile_visibility": "public", "catch_visibility": "public", "location_sharing": true}',
    stats JSONB DEFAULT '{"total_catches": 0, "species_count": 0, "biggest_catch": null, "favorite_species": null}';

-- Enhanced fish species with more detailed information
ALTER TABLE public.fish_species ADD COLUMN IF NOT EXISTS
    common_names TEXT[],
    size_range_min DECIMAL,
    size_range_max DECIMAL,
    weight_range_min DECIMAL,
    weight_range_max DECIMAL,
    spawning_season TEXT,
    active_seasons TEXT[],
    preferred_depth_min DECIMAL,
    preferred_depth_max DECIMAL,
    water_temperature_preference JSONB,
    feeding_times TEXT[],
    behavior_patterns TEXT[],
    conservation_status TEXT,
    identification_tips TEXT,
    similar_species TEXT[],
    catch_difficulty INTEGER CHECK (catch_difficulty >= 1 AND catch_difficulty <= 10) DEFAULT 5,
    popularity_score INTEGER DEFAULT 0;

-- Enhanced catches with more detailed tracking
ALTER TABLE public.catches ADD COLUMN IF NOT EXISTS
    water_depth DECIMAL,
    water_temperature DECIMAL,
    water_clarity TEXT,
    fishing_method TEXT,
    rod_type TEXT,
    reel_type TEXT,
    line_type TEXT,
    hook_size TEXT,
    weather_conditions TEXT,
    moon_phase TEXT,
    tide_phase TEXT,
    fishing_duration INTEGER, -- in minutes
    fight_duration INTEGER, -- in minutes
    release_status TEXT CHECK (release_status IN ('kept', 'released', 'died')) DEFAULT 'released',
    catch_quality INTEGER CHECK (catch_quality >= 1 AND catch_quality <= 10),
    photos JSONB, -- array of photo URLs
    tags TEXT[],
    equipment_used JSONB,
    catch_notes TEXT;

-- Create fishing sessions table for tracking fishing trips
CREATE TABLE public.fishing_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    location_name TEXT,
    coordinates POINT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    weather_data JSONB,
    water_conditions JSONB,
    total_catches INTEGER DEFAULT 0,
    successful_catches INTEGER DEFAULT 0,
    notes TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bait effectiveness tracking
CREATE TABLE public.bait_effectiveness (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    species_id UUID REFERENCES public.fish_species(id) ON DELETE CASCADE NOT NULL,
    bait_name TEXT NOT NULL,
    success_rate DECIMAL CHECK (success_rate >= 0 AND success_rate <= 1),
    total_attempts INTEGER DEFAULT 0,
    successful_catches INTEGER DEFAULT 0,
    weather_conditions JSONB,
    water_conditions JSONB,
    location_type TEXT,
    season TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create community challenges
CREATE TABLE public.challenges (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT CHECK (type IN ('species_count', 'total_catches', 'biggest_fish', 'location_based', 'time_based')) NOT NULL,
    target_value DECIMAL,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    region TEXT,
    species_restrictions TEXT[],
    location_restrictions JSONB,
    reward_type TEXT,
    reward_value TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user challenge participation
CREATE TABLE public.user_challenges (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    challenge_id UUID REFERENCES public.challenges(id) ON DELETE CASCADE NOT NULL,
    progress_value DECIMAL DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, challenge_id)
);

-- Create fishing reports for community insights
CREATE TABLE public.fishing_reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    location_name TEXT NOT NULL,
    coordinates POINT NOT NULL,
    report_date DATE NOT NULL,
    weather_summary TEXT,
    water_conditions TEXT,
    fish_activity_rating INTEGER CHECK (fish_activity_rating >= 1 AND fish_activity_rating <= 10),
    best_times TEXT[],
    successful_baits TEXT[],
    notes TEXT,
    is_public BOOLEAN DEFAULT true,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create report likes
CREATE TABLE public.report_likes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    report_id UUID REFERENCES public.fishing_reports(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, report_id)
);

-- Create catch comments
CREATE TABLE public.catch_comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    catch_id UUID REFERENCES public.catches(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create catch likes
CREATE TABLE public.catch_likes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    catch_id UUID REFERENCES public.catches(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(catch_id, user_id)
);

-- Create leaderboards
CREATE TABLE public.leaderboards (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    type TEXT CHECK (type IN ('total_catches', 'species_count', 'biggest_fish', 'monthly_catches', 'weekly_catches')) NOT NULL,
    period TEXT CHECK (period IN ('all_time', 'yearly', 'monthly', 'weekly')) NOT NULL,
    region TEXT,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    score DECIMAL NOT NULL,
    rank INTEGER,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create fishing tips and techniques
CREATE TABLE public.fishing_tips (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT CHECK (category IN ('technique', 'equipment', 'location', 'timing', 'species_specific')) NOT NULL,
    species_id UUID REFERENCES public.fish_species(id),
    difficulty_level INTEGER CHECK (difficulty_level >= 1 AND difficulty_level <= 5) DEFAULT 1,
    author_id UUID REFERENCES public.users(id),
    is_verified BOOLEAN DEFAULT false,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tip likes
CREATE TABLE public.tip_likes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tip_id UUID REFERENCES public.fishing_tips(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tip_id, user_id)
);

-- Create user preferences for personalized experience
CREATE TABLE public.user_preferences (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    preferred_fishing_times TEXT[],
    preferred_locations JSONB,
    target_species TEXT[],
    skill_level TEXT CHECK (skill_level IN ('beginner', 'intermediate', 'advanced', 'expert')) DEFAULT 'beginner',
    fishing_goals TEXT[],
    equipment_preferences JSONB,
    notification_frequency TEXT CHECK (notification_frequency IN ('immediate', 'daily', 'weekly', 'never')) DEFAULT 'daily',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create hot spots based on community data
CREATE TABLE public.hot_spots (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    coordinates POINT NOT NULL,
    region TEXT NOT NULL,
    water_type TEXT CHECK (water_type IN ('freshwater', 'saltwater', 'estuary')) NOT NULL,
    species_commonly_caught TEXT[],
    average_rating DECIMAL CHECK (average_rating >= 1 AND average_rating <= 5),
    total_reports INTEGER DEFAULT 0,
    last_activity TIMESTAMP WITH TIME ZONE,
    is_verified BOOLEAN DEFAULT false,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for new tables
CREATE INDEX idx_fishing_sessions_user_id ON public.fishing_sessions(user_id);
CREATE INDEX idx_fishing_sessions_start_time ON public.fishing_sessions(start_time);
CREATE INDEX idx_bait_effectiveness_user_species ON public.bait_effectiveness(user_id, species_id);
CREATE INDEX idx_user_challenges_user_id ON public.user_challenges(user_id);
CREATE INDEX idx_user_challenges_challenge_id ON public.user_challenges(challenge_id);
CREATE INDEX idx_fishing_reports_coordinates ON public.fishing_reports USING GIST(coordinates);
CREATE INDEX idx_fishing_reports_date ON public.fishing_reports(report_date);
CREATE INDEX idx_catch_comments_catch_id ON public.catch_comments(catch_id);
CREATE INDEX idx_catch_likes_catch_id ON public.catch_likes(catch_id);
CREATE INDEX idx_leaderboards_type_period ON public.leaderboards(type, period);
CREATE INDEX idx_fishing_tips_category ON public.fishing_tips(category);
CREATE INDEX idx_hot_spots_coordinates ON public.hot_spots USING GIST(coordinates);
CREATE INDEX idx_hot_spots_region ON public.hot_spots(region);

-- Enhanced RLS policies for new tables
ALTER TABLE public.fishing_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bait_effectiveness ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fishing_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catch_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catch_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fishing_tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tip_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hot_spots ENABLE ROW LEVEL SECURITY;

-- Fishing sessions policies
CREATE POLICY "Users can manage own fishing sessions" ON public.fishing_sessions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can read public fishing sessions" ON public.fishing_sessions
    FOR SELECT USING (is_public = true OR auth.uid() = user_id);

-- Bait effectiveness policies
CREATE POLICY "Users can manage own bait effectiveness" ON public.bait_effectiveness
    FOR ALL USING (auth.uid() = user_id);

-- Challenges policies
CREATE POLICY "Anyone can read active challenges" ON public.challenges
    FOR SELECT USING (is_active = true);

CREATE POLICY "Users can create challenges" ON public.challenges
    FOR INSERT WITH CHECK (auth.uid() = created_by);

-- User challenges policies
CREATE POLICY "Users can manage own challenge participation" ON public.user_challenges
    FOR ALL USING (auth.uid() = user_id);

-- Fishing reports policies
CREATE POLICY "Users can read public fishing reports" ON public.fishing_reports
    FOR SELECT USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can manage own fishing reports" ON public.fishing_reports
    FOR ALL USING (auth.uid() = user_id);

-- Report likes policies
CREATE POLICY "Users can manage own report likes" ON public.report_likes
    FOR ALL USING (auth.uid() = user_id);

-- Catch comments policies
CREATE POLICY "Users can read catch comments" ON public.catch_comments
    FOR SELECT USING (true);

CREATE POLICY "Users can create catch comments" ON public.catch_comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own catch comments" ON public.catch_comments
    FOR DELETE USING (auth.uid() = user_id);

-- Catch likes policies
CREATE POLICY "Users can manage own catch likes" ON public.catch_likes
    FOR ALL USING (auth.uid() = user_id);

-- Leaderboards policies
CREATE POLICY "Anyone can read leaderboards" ON public.leaderboards
    FOR SELECT USING (true);

-- Fishing tips policies
CREATE POLICY "Anyone can read fishing tips" ON public.fishing_tips
    FOR SELECT USING (true);

CREATE POLICY "Users can create fishing tips" ON public.fishing_tips
    FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own fishing tips" ON public.fishing_tips
    FOR UPDATE USING (auth.uid() = author_id);

-- Tip likes policies
CREATE POLICY "Users can manage own tip likes" ON public.tip_likes
    FOR ALL USING (auth.uid() = user_id);

-- User preferences policies
CREATE POLICY "Users can manage own preferences" ON public.user_preferences
    FOR ALL USING (auth.uid() = user_id);

-- Hot spots policies
CREATE POLICY "Anyone can read hot spots" ON public.hot_spots
    FOR SELECT USING (true);

CREATE POLICY "Users can create hot spots" ON public.hot_spots
    FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Functions for enhanced functionality
CREATE OR REPLACE FUNCTION public.calculate_fishing_rating(
    pressure DECIMAL,
    wind_speed DECIMAL,
    temperature DECIMAL,
    humidity DECIMAL,
    cloud_cover DECIMAL,
    moon_phase TEXT DEFAULT NULL,
    tide_phase TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    rating INTEGER := 5;
BEGIN
    -- Pressure analysis (most important factor)
    IF pressure > 1013 THEN
        rating := rating + 2;
    ELSIF pressure > 1000 THEN
        rating := rating + 1;
    ELSIF pressure < 990 THEN
        rating := rating - 2;
    END IF;
    
    -- Wind analysis
    IF wind_speed < 10 THEN
        rating := rating + 1;
    ELSIF wind_speed > 25 THEN
        rating := rating - 2;
    END IF;
    
    -- Temperature analysis
    IF temperature >= 15 AND temperature <= 25 THEN
        rating := rating + 1;
    ELSIF temperature < 5 OR temperature > 35 THEN
        rating := rating - 2;
    END IF;
    
    -- Humidity analysis
    IF humidity >= 40 AND humidity <= 70 THEN
        rating := rating + 1;
    END IF;
    
    -- Cloud cover
    IF cloud_cover < 30 THEN
        rating := rating + 1;
    ELSIF cloud_cover > 80 THEN
        rating := rating - 1;
    END IF;
    
    -- Moon phase analysis
    IF moon_phase IN ('New Moon', 'Full Moon') THEN
        rating := rating + 1;
    END IF;
    
    -- Tide analysis
    IF tide_phase IN ('High Tide', 'Low Tide') THEN
        rating := rating + 1;
    END IF;
    
    RETURN GREATEST(1, LEAST(10, rating));
END;
$$ LANGUAGE plpgsql;

-- Function to update user stats
CREATE OR REPLACE FUNCTION public.update_user_stats(user_uuid UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.users SET
        stats = jsonb_build_object(
            'total_catches', (SELECT COUNT(*) FROM public.catches WHERE user_id = user_uuid),
            'species_count', (SELECT COUNT(DISTINCT species_id) FROM public.catches WHERE user_id = user_uuid),
            'biggest_catch', (SELECT jsonb_build_object('weight', MAX(weight), 'length', MAX(length), 'species', fs.name) 
                             FROM public.catches c 
                             JOIN public.fish_species fs ON c.species_id = fs.id 
                             WHERE c.user_id = user_uuid AND c.weight IS NOT NULL),
            'favorite_species', (SELECT fs.name 
                                FROM public.catches c 
                                JOIN public.fish_species fs ON c.species_id = fs.id 
                                WHERE c.user_id = user_uuid 
                                GROUP BY fs.id, fs.name 
                                ORDER BY COUNT(*) DESC 
                                LIMIT 1)
        )
    WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to create achievement
CREATE OR REPLACE FUNCTION public.create_achievement(
    user_uuid UUID,
    achievement_type TEXT,
    achievement_title TEXT,
    achievement_description TEXT,
    achievement_data JSONB DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    INSERT INTO public.achievements (user_id, type, title, description, data)
    VALUES (user_uuid, achievement_type, achievement_title, achievement_description, achievement_data);
    
    -- Create notification
    INSERT INTO public.notifications (user_id, message, type, data)
    VALUES (user_uuid, 'New Achievement: ' || achievement_title, 'achievement', 
            jsonb_build_object('achievement_type', achievement_type, 'title', achievement_title));
END;
$$ LANGUAGE plpgsql;

-- Trigger to update user stats when catches change
CREATE OR REPLACE FUNCTION public.trigger_update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        PERFORM public.update_user_stats(NEW.user_id);
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM public.update_user_stats(OLD.user_id);
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_stats_on_catch_change
    AFTER INSERT OR UPDATE OR DELETE ON public.catches
    FOR EACH ROW EXECUTE FUNCTION public.trigger_update_user_stats();

-- Function to check and award achievements
CREATE OR REPLACE FUNCTION public.check_achievements(user_uuid UUID)
RETURNS void AS $$
DECLARE
    total_catches INTEGER;
    species_count INTEGER;
    biggest_weight DECIMAL;
BEGIN
    -- Get user stats
    SELECT COUNT(*), COUNT(DISTINCT species_id), MAX(weight)
    INTO total_catches, species_count, biggest_weight
    FROM public.catches
    WHERE user_id = user_uuid;
    
    -- First catch achievement
    IF total_catches = 1 THEN
        PERFORM public.create_achievement(user_uuid, 'first_catch', 'First Catch!', 'You caught your first fish!');
    END IF;
    
    -- Species achievements
    IF species_count = 5 THEN
        PERFORM public.create_achievement(user_uuid, 'species_collector', 'Species Collector', 'You have caught 5 different species!');
    ELSIF species_count = 10 THEN
        PERFORM public.create_achievement(user_uuid, 'species_master', 'Species Master', 'You have caught 10 different species!');
    ELSIF species_count = 25 THEN
        PERFORM public.create_achievement(user_uuid, 'species_expert', 'Species Expert', 'You have caught 25 different species!');
    END IF;
    
    -- Catch count achievements
    IF total_catches = 10 THEN
        PERFORM public.create_achievement(user_uuid, 'dedicated_angler', 'Dedicated Angler', 'You have logged 10 catches!');
    ELSIF total_catches = 50 THEN
        PERFORM public.create_achievement(user_uuid, 'experienced_angler', 'Experienced Angler', 'You have logged 50 catches!');
    ELSIF total_catches = 100 THEN
        PERFORM public.create_achievement(user_uuid, 'fishing_legend', 'Fishing Legend', 'You have logged 100 catches!');
    END IF;
    
    -- Big fish achievements
    IF biggest_weight >= 10 THEN
        PERFORM public.create_achievement(user_uuid, 'big_fish_hunter', 'Big Fish Hunter', 'You caught a fish weighing 10+ pounds!');
    ELSIF biggest_weight >= 20 THEN
        PERFORM public.create_achievement(user_uuid, 'monster_fish', 'Monster Fish', 'You caught a fish weighing 20+ pounds!');
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger to check achievements when catches are added
CREATE OR REPLACE FUNCTION public.trigger_check_achievements()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM public.check_achievements(NEW.user_id);
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_achievements_on_catch_insert
    AFTER INSERT ON public.catches
    FOR EACH ROW EXECUTE FUNCTION public.trigger_check_achievements();
