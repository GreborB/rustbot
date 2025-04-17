function getServerTime() {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

function getTimeUntilNight() {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  
  // Assuming night starts at 18:00 and ends at 6:00
  if (hours >= 6 && hours < 18) {
    // Daytime
    const nightStart = new Date();
    nightStart.setHours(18, 0, 0, 0);
    const timeUntilNight = nightStart - now;
    
    const hoursLeft = Math.floor(timeUntilNight / (60 * 60 * 1000));
    const minutesLeft = Math.floor((timeUntilNight % (60 * 60 * 1000)) / (60 * 1000));
    
    return `Night starts in ${hoursLeft}h${minutesLeft}m`;
  } else {
    // Nighttime
    const morningStart = new Date();
    if (hours < 6) {
      morningStart.setHours(6, 0, 0, 0);
    } else {
      morningStart.setDate(morningStart.getDate() + 1);
      morningStart.setHours(6, 0, 0, 0);
    }
    const timeUntilMorning = morningStart - now;
    
    const hoursLeft = Math.floor(timeUntilMorning / (60 * 60 * 1000));
    const minutesLeft = Math.floor((timeUntilMorning % (60 * 60 * 1000)) / (60 * 1000));
    
    return `Morning starts in ${hoursLeft}h${minutesLeft}m`;
  }
}

export default {
  getServerTime,
  getTimeUntilNight
}; 