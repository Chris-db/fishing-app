-- Insert sample fish species data
INSERT INTO public.fish_species (name, scientific_name, region, description, habitat, feeding_habits, best_baits, legal_size_limit, rarity, water_type) VALUES
-- Freshwater species
('Largemouth Bass', 'Micropterus salmoides', 'North America', 'Popular game fish known for aggressive strikes', 'Lakes, ponds, rivers with vegetation', 'Ambush predator, feeds on smaller fish and insects', ARRAY['Plastic worms', 'Crankbaits', 'Spinnerbaits', 'Topwater lures'], 12.0, 'common', 'freshwater'),
('Smallmouth Bass', 'Micropterus dolomieu', 'North America', 'Fighter fish preferring cooler, clearer water', 'Rocky areas, clear lakes and rivers', 'Active predator, feeds on crayfish and small fish', ARRAY['Jigs', 'Crankbaits', 'Live bait'], 10.0, 'common', 'freshwater'),
('Rainbow Trout', 'Oncorhynchus mykiss', 'North America', 'Beautiful fish with distinctive pink stripe', 'Cold, clear streams and lakes', 'Feeds on insects, small fish, and crustaceans', ARRAY['Flies', 'Spinners', 'PowerBait', 'Worms'], 8.0, 'common', 'freshwater'),
('Brown Trout', 'Salmo trutta', 'North America', 'Wary fish requiring stealth and patience', 'Cold streams and deep lakes', 'Opportunistic feeder, very selective', ARRAY['Dry flies', 'Nymphs', 'Streamers', 'Live bait'], 9.0, 'uncommon', 'freshwater'),
('Northern Pike', 'Esox lucius', 'North America', 'Aggressive predator with sharp teeth', 'Weedy areas of lakes and rivers', 'Ambush predator, feeds on fish and small mammals', ARRAY['Spoons', 'Spinnerbaits', 'Live bait', 'Large lures'], 24.0, 'common', 'freshwater'),
('Walleye', 'Sander vitreus', 'North America', 'Prized fish with excellent table fare', 'Deep, cool waters with rocky structure', 'Feeds primarily at night on small fish', ARRAY['Jigs', 'Crankbaits', 'Live bait', 'Trolling lures'], 15.0, 'common', 'freshwater'),
('Bluegill', 'Lepomis macrochirus', 'North America', 'Popular panfish, great for beginners', 'Shallow, weedy areas', 'Feeds on insects, small crustaceans', ARRAY['Worms', 'Small jigs', 'Flies', 'Crickets'], 6.0, 'common', 'freshwater'),
('Crappie', 'Pomoxis spp.', 'North America', 'Delicate fish with excellent taste', 'Structure near deep water', 'Feeds on small fish and insects', ARRAY['Small jigs', 'Minnows', 'Small crankbaits'], 8.0, 'common', 'freshwater'),
('Catfish', 'Ictaluridae', 'North America', 'Bottom feeder with excellent sense of smell', 'Deep holes, undercuts, structure', 'Scavenger, feeds on dead and live bait', ARRAY['Chicken liver', 'Worms', 'Cut bait', 'Stink bait'], 12.0, 'common', 'freshwater'),
('Muskie', 'Esox masquinongy', 'North America', 'The fish of 10,000 casts', 'Deep, clear lakes with structure', 'Apex predator, very selective', ARRAY['Large bucktails', 'Jerkbaits', 'Live bait'], 30.0, 'legendary', 'freshwater'),

-- Saltwater species
('Red Snapper', 'Lutjanus campechanus', 'Gulf of Mexico', 'Popular reef fish with excellent taste', 'Reefs, wrecks, and structure', 'Feeds on smaller fish and crustaceans', ARRAY['Live bait', 'Cut bait', 'Jigs'], 16.0, 'common', 'saltwater'),
('Grouper', 'Epinephelus spp.', 'Gulf of Mexico', 'Large reef fish with mild flavor', 'Deep reefs and structure', 'Ambush predator, feeds on fish and crustaceans', ARRAY['Live bait', 'Cut bait', 'Large jigs'], 20.0, 'uncommon', 'saltwater'),
('Tarpon', 'Megalops atlanticus', 'Gulf of Mexico', 'Famous for spectacular jumps', 'Shallow bays and passes', 'Feeds on small fish and crustaceans', ARRAY['Live bait', 'Artificial lures', 'Flies'], 40.0, 'rare', 'saltwater'),
('Redfish', 'Sciaenops ocellatus', 'Gulf of Mexico', 'Popular inshore game fish', 'Shallow bays and grass flats', 'Feeds on crustaceans and small fish', ARRAY['Live bait', 'Soft plastics', 'Spoons'], 20.0, 'common', 'saltwater'),
('Speckled Trout', 'Cynoscion nebulosus', 'Gulf of Mexico', 'Delicate inshore fish', 'Grass flats and oyster bars', 'Feeds on shrimp and small fish', ARRAY['Live shrimp', 'Soft plastics', 'Topwater lures'], 15.0, 'common', 'saltwater'),
('Flounder', 'Paralichthys spp.', 'Gulf of Mexico', 'Flatfish that buries in sand', 'Sandy bottoms near structure', 'Ambush predator, feeds on small fish', ARRAY['Live bait', 'Jigs', 'Soft plastics'], 12.0, 'common', 'saltwater'),
('King Mackerel', 'Scomberomorus cavalla', 'Gulf of Mexico', 'Fast, powerful pelagic fish', 'Open water and reefs', 'Feeds on smaller fish', ARRAY['Live bait', 'Trolling lures', 'Jigs'], 24.0, 'uncommon', 'saltwater'),
('Cobia', 'Rachycentron canadum', 'Gulf of Mexico', 'Large, powerful fish', 'Near structure and wrecks', 'Feeds on crabs and small fish', ARRAY['Live bait', 'Jigs', 'Trolling lures'], 33.0, 'rare', 'saltwater'),
('Mahi Mahi', 'Coryphaena hippurus', 'Gulf of Mexico', 'Colorful pelagic fish', 'Open water', 'Feeds on flying fish and squid', ARRAY['Trolling lures', 'Live bait', 'Flies'], 20.0, 'uncommon', 'saltwater'),
('Sailfish', 'Istiophorus platypterus', 'Gulf of Mexico', 'Fastest fish in the ocean', 'Deep blue water', 'Feeds on small fish and squid', ARRAY['Live bait', 'Trolling lures', 'Flies'], 63.0, 'legendary', 'saltwater');

-- Insert sample weather forecast data
INSERT INTO public.weather_forecasts (location, coordinates, date, pressure, wind_speed, wind_direction, temperature, humidity, cloud_cover, fishing_rating) VALUES
('Austin, TX', POINT(-97.7431, 30.2672), CURRENT_DATE, 1013.2, 8.5, 180, 22.5, 65, 30, 7),
('Austin, TX', POINT(-97.7431, 30.2672), CURRENT_DATE + INTERVAL '1 day', 1015.8, 6.2, 200, 24.1, 58, 20, 8),
('Austin, TX', POINT(-97.7431, 30.2672), CURRENT_DATE + INTERVAL '2 days', 1012.1, 12.3, 160, 20.8, 72, 60, 6),
('Austin, TX', POINT(-97.7431, 30.2672), CURRENT_DATE + INTERVAL '3 days', 1008.5, 15.7, 140, 18.2, 78, 85, 4),
('Austin, TX', POINT(-97.7431, 30.2672), CURRENT_DATE + INTERVAL '4 days', 1010.2, 9.8, 220, 21.5, 62, 40, 7),
('Austin, TX', POINT(-97.7431, 30.2672), CURRENT_DATE + INTERVAL '5 days', 1014.6, 5.5, 250, 25.3, 55, 15, 9),
('Austin, TX', POINT(-97.7431, 30.2672), CURRENT_DATE + INTERVAL '6 days', 1016.1, 7.1, 190, 23.7, 60, 25, 8),
('Austin, TX', POINT(-97.7431, 30.2672), CURRENT_DATE + INTERVAL '7 days', 1011.8, 11.2, 170, 19.8, 68, 50, 6);

-- Note: Sample fishing spots will be created by users when they register and log catches
-- This avoids foreign key constraint issues with non-existent user IDs
