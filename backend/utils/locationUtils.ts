export const earthRadiusKm = 6371; // Earth's radius in km
export function getBoundingBox(lat: number, lon: number, distanceKm: number = 10) {
    
  
    const latDiff = (distanceKm / earthRadiusKm) * (180 / Math.PI);
    const lonDiff = (distanceKm / (earthRadiusKm * Math.cos(lat * (Math.PI / 180)))) * (180 / Math.PI);
  
    return {
      minLat: lat - latDiff,
      maxLat: lat + latDiff,
      minLon: lon - lonDiff,
      maxLon: lon + lonDiff,
    };
  }