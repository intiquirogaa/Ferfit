export function getLevelProgress(xp: number) {
    const levels = [
      0,
      100,
      250,
      450,
      700,
      1000,
      1400,
      1900,
      2500,
    ];
  
    let level = 1;
  
    while (level < levels.length && xp >= levels[level]) {
      level++;
    }
  
    const currentLevelXP = levels[level - 1];
    const nextLevelXP = levels[level] ?? currentLevelXP + 500;
  
    const progress =
      ((xp - currentLevelXP) /
        (nextLevelXP - currentLevelXP)) *
      100;
  
    return {
      level,
      progress,
      currentLevelXP,
      nextLevelXP,
    };
  }