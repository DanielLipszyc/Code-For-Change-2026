export interface PlantFeatures {
  leaf: {
    shape?: string[];
    margin?: string[];
    arrangement?: string[];
    venation?: string[];
    texture?: string[];
    notes?: string;
  };

  flower: {
    color?: string[];
    shape?: string[];
    petal_count?: number;
    inflorescence?: string[];
    season?: string[];
    notes?: string;
  };

  fruit_seed: {
    type?: string[];
    color?: string[];
    shape?: string[];
    surface?: string[];
    dispersal?: string[];
    notes?: string;
  };

  form: {
    growth_habit?: string[];
    height_m?: number;
    stem_type?: string[];
    habitat?: string[];
    notes?: string;
  };
}
