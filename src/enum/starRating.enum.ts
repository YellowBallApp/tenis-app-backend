export enum StarRating {
  ONE_STAR = 1.0,        // 1000-1149: Çok Başlangıç
  ONE_HALF_STAR = 1.5,   // 1150-1299: Başlangıç
  TWO_STAR = 2.0,        // 1300-1449: Orta Alt
  TWO_HALF_STAR = 2.5,   // 1450-1599: Orta
  THREE_STAR = 3.0,      // 1600-1749: Orta Üst
  THREE_HALF_STAR = 3.5, // 1750-1899: İyi
  FOUR_STAR = 4.0,       // 1900-2049: Çok İyi
  FOUR_HALF_STAR = 4.5,  // 2050-2199: İleri Seviye
  FIVE_STAR = 5.0        // 2200+: Elit
}

export const ELO_RATING_RANGES = {
  [StarRating.ONE_STAR]: { min: 1000, max: 1149, label: 'Çok Başlangıç' },
  [StarRating.ONE_HALF_STAR]: { min: 1150, max: 1299, label: 'Başlangıç' },
  [StarRating.TWO_STAR]: { min: 1300, max: 1449, label: 'Orta Alt' },
  [StarRating.TWO_HALF_STAR]: { min: 1450, max: 1599, label: 'Orta' },
  [StarRating.THREE_STAR]: { min: 1600, max: 1749, label: 'Orta Üst' },
  [StarRating.THREE_HALF_STAR]: { min: 1750, max: 1899, label: 'İyi' },
  [StarRating.FOUR_STAR]: { min: 1900, max: 2049, label: 'Çok İyi' },
  [StarRating.FOUR_HALF_STAR]: { min: 2050, max: 2199, label: 'İleri Seviye' },
  [StarRating.FIVE_STAR]: { min: 2200, max: 9999, label: 'Elit' }
};

export function getStarRatingFromElo(eloRating: number): StarRating {
  if (eloRating < 1150) return StarRating.ONE_STAR;
  if (eloRating < 1300) return StarRating.ONE_HALF_STAR;
  if (eloRating < 1450) return StarRating.TWO_STAR;
  if (eloRating < 1600) return StarRating.TWO_HALF_STAR;
  if (eloRating < 1750) return StarRating.THREE_STAR;
  if (eloRating < 1900) return StarRating.THREE_HALF_STAR;
  if (eloRating < 2050) return StarRating.FOUR_STAR;
  if (eloRating < 2200) return StarRating.FOUR_HALF_STAR;
  return StarRating.FIVE_STAR;
}

export function getEloRangeForStarRating(starRating: StarRating): { min: number; max: number; label: string } {
  return ELO_RATING_RANGES[starRating];
}

