import { supabase, FishSpecies, Catch } from './supabase';

export interface FishSpeciesWithStats extends FishSpecies {
  times_caught: number;
  average_weight: number;
  average_length: number;
  biggest_catch: number;
  smallest_catch: number;
  first_caught: string;
  last_caught: string;
  is_unlocked: boolean;
  user_stats: {
    total_catches: number;
    best_catch: Catch | null;
    recent_catches: Catch[];
  };
}

export interface TrophyRoomStats {
  total_species: number;
  unlocked_species: number;
  total_catches: number;
  biggest_fish: {
    species: string;
    weight: number;
    length: number;
  } | null;
  rarest_species: FishSpecies | null;
  completion_percentage: number;
  achievements: {
    first_catch: boolean;
    species_collector: boolean;
    big_fish_hunter: boolean;
    trophy_hunter: boolean;
  };
}

export interface SpeciesFilter {
  water_type?: 'freshwater' | 'saltwater' | 'estuary';
  rarity?: 'common' | 'uncommon' | 'rare' | 'legendary';
  unlocked_only?: boolean;
  search_term?: string;
  sort_by?: 'name' | 'rarity' | 'times_caught' | 'biggest_catch';
  sort_order?: 'asc' | 'desc';
}

export class FishService {
  static async getSpeciesByRegion(region: string, userId: string): Promise<FishSpeciesWithStats[]> {
    try {
      const { data: species, error } = await supabase
        .from('fish_species')
        .select(`
          *,
          catches!inner(
            id,
            weight,
            length,
            date,
            time,
            user_id
          )
        `)
        .eq('region', region);

      if (error) throw error;

      // Get user's catch statistics for each species
      const speciesWithStats = await Promise.all(
        species.map(async (species) => {
          const { data: userCatches, error: catchError } = await supabase
            .from('catches')
            .select('*')
            .eq('species_id', species.id)
            .eq('user_id', userId)
            .order('date', { ascending: false });

          if (catchError) throw catchError;

          const timesCaught = userCatches?.length || 0;
          const weights = userCatches?.map(c => c.weight).filter(w => w !== null) || [];
          const lengths = userCatches?.map(c => c.length).filter(l => l !== null) || [];

          return {
            ...species,
            times_caught: timesCaught,
            average_weight: weights.length > 0 ? weights.reduce((a, b) => a + b, 0) / weights.length : 0,
            average_length: lengths.length > 0 ? lengths.reduce((a, b) => a + b, 0) / lengths.length : 0,
            biggest_catch: weights.length > 0 ? Math.max(...weights) : 0,
            smallest_catch: weights.length > 0 ? Math.min(...weights) : 0,
            first_caught: userCatches?.[userCatches.length - 1]?.date || null,
            last_caught: userCatches?.[0]?.date || null,
            is_unlocked: timesCaught > 0,
            user_stats: {
              total_catches: timesCaught,
              best_catch: userCatches?.[0] || null,
              recent_catches: userCatches?.slice(0, 5) || [],
            },
          };
        })
      );

      return speciesWithStats;
    } catch (error) {
      console.error('Error fetching species by region:', error);
      throw error;
    }
  }

  static async getTrophyRoomStats(userId: string): Promise<TrophyRoomStats> {
    try {
      // Get user's total catches
      const { data: catches, error: catchError } = await supabase
        .from('catches')
        .select('*, fish_species(*)')
        .eq('user_id', userId);

      if (catchError) throw catchError;

      const totalCatches = catches?.length || 0;
      const uniqueSpecies = new Set(catches?.map(c => c.species_id) || []);
      const unlockedSpecies = uniqueSpecies.size;

      // Get all species in user's region
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('location')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      const { data: allSpecies, error: speciesError } = await supabase
        .from('fish_species')
        .select('id')
        .eq('region', user.location || 'North America');

      if (speciesError) throw speciesError;

      const totalSpecies = allSpecies?.length || 0;
      const completionPercentage = totalSpecies > 0 ? (unlockedSpecies / totalSpecies) * 100 : 0;

      // Find biggest fish
      const catchesWithWeight = catches?.filter(c => c.weight !== null) || [];
      const biggestCatch = catchesWithWeight.length > 0 
        ? catchesWithWeight.reduce((max, current) => 
            current.weight > max.weight ? current : max
          )
        : null;

      // Find rarest species caught
      const speciesRarity = catches?.reduce((acc, catch_) => {
        const rarity = catch_.fish_species?.rarity;
        if (rarity) {
          acc[rarity] = (acc[rarity] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>) || {};

      const rarestSpecies = catches?.find(c => 
        c.fish_species?.rarity === 'legendary'
      )?.fish_species || null;

      // Check achievements
      const achievements = {
        first_catch: totalCatches > 0,
        species_collector: unlockedSpecies >= 5,
        big_fish_hunter: biggestCatch ? biggestCatch.weight >= 10 : false,
        trophy_hunter: unlockedSpecies >= 10,
      };

      return {
        total_species: totalSpecies,
        unlocked_species: unlockedSpecies,
        total_catches: totalCatches,
        biggest_fish: biggestCatch ? {
          species: biggestCatch.fish_species?.name || 'Unknown',
          weight: biggestCatch.weight,
          length: biggestCatch.length || 0,
        } : null,
        rarest_species: rarestSpecies,
        completion_percentage: Math.round(completionPercentage),
        achievements,
      };
    } catch (error) {
      console.error('Error fetching trophy room stats:', error);
      throw error;
    }
  }

  static async getSpeciesById(speciesId: string, userId: string): Promise<FishSpeciesWithStats | null> {
    try {
      const { data: species, error } = await supabase
        .from('fish_species')
        .select('*')
        .eq('id', speciesId)
        .single();

      if (error) throw error;

      // Get user's catches for this species
      const { data: userCatches, error: catchError } = await supabase
        .from('catches')
        .select('*')
        .eq('species_id', speciesId)
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (catchError) throw catchError;

      const timesCaught = userCatches?.length || 0;
      const weights = userCatches?.map(c => c.weight).filter(w => w !== null) || [];
      const lengths = userCatches?.map(c => c.length).filter(l => l !== null) || [];

      return {
        ...species,
        times_caught: timesCaught,
        average_weight: weights.length > 0 ? weights.reduce((a, b) => a + b, 0) / weights.length : 0,
        average_length: lengths.length > 0 ? lengths.reduce((a, b) => a + b, 0) / lengths.length : 0,
        biggest_catch: weights.length > 0 ? Math.max(...weights) : 0,
        smallest_catch: weights.length > 0 ? Math.min(...weights) : 0,
        first_caught: userCatches?.[userCatches.length - 1]?.date || null,
        last_caught: userCatches?.[0]?.date || null,
        is_unlocked: timesCaught > 0,
        user_stats: {
          total_catches: timesCaught,
          best_catch: userCatches?.[0] || null,
          recent_catches: userCatches?.slice(0, 5) || [],
        },
      };
    } catch (error) {
      console.error('Error fetching species by ID:', error);
      throw error;
    }
  }

  static async searchSpecies(query: string, userId: string, filters: SpeciesFilter = {}): Promise<FishSpeciesWithStats[]> {
    try {
      let queryBuilder = supabase
        .from('fish_species')
        .select(`
          *,
          catches!inner(
            id,
            weight,
            length,
            date,
            time,
            user_id
          )
        `);

      // Apply search term
      if (query) {
        queryBuilder = queryBuilder.or(`name.ilike.%${query}%,scientific_name.ilike.%${query}%,description.ilike.%${query}%`);
      }

      // Apply filters
      if (filters.water_type) {
        queryBuilder = queryBuilder.eq('water_type', filters.water_type);
      }

      if (filters.rarity) {
        queryBuilder = queryBuilder.eq('rarity', filters.rarity);
      }

      const { data: species, error } = await queryBuilder;

      if (error) throw error;

      // Get user's catch statistics for each species
      const speciesWithStats = await Promise.all(
        species.map(async (species) => {
          const { data: userCatches, error: catchError } = await supabase
            .from('catches')
            .select('*')
            .eq('species_id', species.id)
            .eq('user_id', userId)
            .order('date', { ascending: false });

          if (catchError) throw catchError;

          const timesCaught = userCatches?.length || 0;
          const weights = userCatches?.map(c => c.weight).filter(w => w !== null) || [];
          const lengths = userCatches?.map(c => c.length).filter(l => l !== null) || [];

          return {
            ...species,
            times_caught: timesCaught,
            average_weight: weights.length > 0 ? weights.reduce((a, b) => a + b, 0) / weights.length : 0,
            average_length: lengths.length > 0 ? lengths.reduce((a, b) => a + b, 0) / lengths.length : 0,
            biggest_catch: weights.length > 0 ? Math.max(...weights) : 0,
            smallest_catch: weights.length > 0 ? Math.min(...weights) : 0,
            first_caught: userCatches?.[userCatches.length - 1]?.date || null,
            last_caught: userCatches?.[0]?.date || null,
            is_unlocked: timesCaught > 0,
            user_stats: {
              total_catches: timesCaught,
              best_catch: userCatches?.[0] || null,
              recent_catches: userCatches?.slice(0, 5) || [],
            },
          };
        })
      );

      // Apply unlocked filter
      let filteredSpecies = speciesWithStats;
      if (filters.unlocked_only) {
        filteredSpecies = speciesWithStats.filter(s => s.is_unlocked);
      }

      // Apply sorting
      if (filters.sort_by) {
        filteredSpecies.sort((a, b) => {
          let aValue: any, bValue: any;

          switch (filters.sort_by) {
            case 'name':
              aValue = a.name.toLowerCase();
              bValue = b.name.toLowerCase();
              break;
            case 'rarity':
              const rarityOrder = { common: 1, uncommon: 2, rare: 3, legendary: 4 };
              aValue = rarityOrder[a.rarity as keyof typeof rarityOrder] || 0;
              bValue = rarityOrder[b.rarity as keyof typeof rarityOrder] || 0;
              break;
            case 'times_caught':
              aValue = a.times_caught;
              bValue = b.times_caught;
              break;
            case 'biggest_catch':
              aValue = a.biggest_catch;
              bValue = b.biggest_catch;
              break;
            default:
              return 0;
          }

          if (filters.sort_order === 'desc') {
            return bValue > aValue ? 1 : bValue < aValue ? -1 : 0;
          } else {
            return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
          }
        });
      }

      return filteredSpecies;
    } catch (error) {
      console.error('Error searching species:', error);
      throw error;
    }
  }

  static async getRarityDistribution(userId: string): Promise<Record<string, number>> {
    try {
      const { data: catches, error } = await supabase
        .from('catches')
        .select('fish_species(rarity)')
        .eq('user_id', userId);

      if (error) throw error;

      const distribution = catches?.reduce((acc, catch_) => {
        const rarity = catch_.fish_species?.rarity;
        if (rarity) {
          acc[rarity] = (acc[rarity] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>) || {};

      return distribution;
    } catch (error) {
      console.error('Error fetching rarity distribution:', error);
      throw error;
    }
  }

  static async getRecentCatches(userId: string, limit: number = 10): Promise<Catch[]> {
    try {
      const { data: catches, error } = await supabase
        .from('catches')
        .select(`
          *,
          fish_species(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return catches || [];
    } catch (error) {
      console.error('Error fetching recent catches:', error);
      throw error;
    }
  }

  static async getSpeciesByRarity(rarity: string, userId: string): Promise<FishSpeciesWithStats[]> {
    try {
      const { data: species, error } = await supabase
        .from('fish_species')
        .select('*')
        .eq('rarity', rarity);

      if (error) throw error;

      // Get user's catch statistics for each species
      const speciesWithStats = await Promise.all(
        species.map(async (species) => {
          const { data: userCatches, error: catchError } = await supabase
            .from('catches')
            .select('*')
            .eq('species_id', species.id)
            .eq('user_id', userId)
            .order('date', { ascending: false });

          if (catchError) throw catchError;

          const timesCaught = userCatches?.length || 0;
          const weights = userCatches?.map(c => c.weight).filter(w => w !== null) || [];
          const lengths = userCatches?.map(c => c.length).filter(l => l !== null) || [];

          return {
            ...species,
            times_caught: timesCaught,
            average_weight: weights.length > 0 ? weights.reduce((a, b) => a + b, 0) / weights.length : 0,
            average_length: lengths.length > 0 ? lengths.reduce((a, b) => a + b, 0) / lengths.length : 0,
            biggest_catch: weights.length > 0 ? Math.max(...weights) : 0,
            smallest_catch: weights.length > 0 ? Math.min(...weights) : 0,
            first_caught: userCatches?.[userCatches.length - 1]?.date || null,
            last_caught: userCatches?.[0]?.date || null,
            is_unlocked: timesCaught > 0,
            user_stats: {
              total_catches: timesCaught,
              best_catch: userCatches?.[0] || null,
              recent_catches: userCatches?.slice(0, 5) || [],
            },
          };
        })
      );

      return speciesWithStats;
    } catch (error) {
      console.error('Error fetching species by rarity:', error);
      throw error;
    }
  }
}
