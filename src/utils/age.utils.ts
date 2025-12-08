/**
 * Calculates age from birth date
 * @param birthDate - Date of birth
 * @returns Age in years, or null if birthDate is null/undefined
 */
export function calculateAge(birthDate: Date | null | undefined): number | null {
  if (!birthDate) {
    return null;
  }

  const today = new Date();
  const birth = new Date(birthDate);
  
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  // If birthday hasn't occurred this year yet, subtract 1
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}
