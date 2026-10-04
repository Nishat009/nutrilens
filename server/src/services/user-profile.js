// Helpers that read a user document / onboarding payload consistently.
// Onboarding stores conditions in `healthConditions`; older records and some
// endpoints use `medicalConditions`, so both are merged here.

function getUserConditions(profile = {}) {
  const raw = [
    ...(profile.healthConditions || []),
    ...(profile.medicalConditions || profile.medical_conditions || []),
  ];
  return [...new Set(raw.map((c) => String(c).toLowerCase().trim()).filter((c) => c && c !== 'none'))];
}

function getUserAge(profile = {}) {
  if (typeof profile.age === 'number' && profile.age > 0) return profile.age;
  if (profile.dob) {
    const birth = new Date(profile.dob);
    if (!Number.isNaN(birth.getTime())) {
      const now = new Date();
      let age = now.getFullYear() - birth.getFullYear();
      const beforeBirthday =
        now.getMonth() < birth.getMonth() ||
        (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate());
      if (beforeBirthday) age -= 1;
      if (age > 0 && age < 120) return age;
    }
  }
  return null;
}

function getUserBmi(profile = {}) {
  if (profile.bmi) return profile.bmi;
  const weightKg = Number(profile.weightKg);
  const heightCm = Number(profile.heightCm);
  if (!weightKg || !heightCm) return null;
  return weightKg / Math.pow(heightCm / 100, 2);
}

// Matches the BMI buckets used in the canonical diet eligibility data.
function getBmiCategory(bmi) {
  if (!bmi) return null;
  if (bmi < 18.5) return 'underweight';
  if (bmi < 25) return 'normal';
  if (bmi < 30) return 'overweight';
  return 'obesity';
}

// Onboarding activity ids -> canonical eligibility activity levels.
const ACTIVITY_LEVEL_MAP = {
  sedentary: 'sedentary',
  lightly_active: 'light',
  moderately_active: 'moderate',
  very_active: 'high',
  extra_active: 'high',
};

function getActivityCategory(profile = {}) {
  return ACTIVITY_LEVEL_MAP[profile.activityLevel] || null;
}

module.exports = {
  getUserConditions,
  getUserAge,
  getUserBmi,
  getBmiCategory,
  getActivityCategory,
};
