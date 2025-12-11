// Service Center mapping utility
// Maps service center codes to their names
// Some service centers have multiple codes

export interface ServiceCenter {
  name: string;
  codes: number[];
}

// Service center definitions with all their codes
export const serviceCenters: ServiceCenter[] = [
  { name: 'Andover', codes: [14, 16] },
  { name: 'Atlanta', codes: [31] },
  { name: 'Austin', codes: [75, 76, 20, 21] },
  { name: 'Brookhaven', codes: [10] },
  { name: 'Cincinnati', codes: [26, 27, 35, 38] },
  { name: 'Fresno', codes: [80, 90] },
  { name: 'Kansas City', codes: [37, 40, 42, 44, 70, 79] },
  { name: 'Memphis', codes: [55] },
  { name: 'Ogden', codes: [60, 78, 81, 82, 83, 86, 88, 91, 92, 93] },
  { name: 'Philadelphia', codes: [30, 32] }
];

// Create a flat map from code to service center name for quick lookups
export const serviceCenterMap: { [code: number]: string } = {};
serviceCenters.forEach(center => {
  center.codes.forEach(code => {
    serviceCenterMap[code] = center.name;
  });
});

/**
 * Get service center name by code
 * @param code - Service center code
 * @returns Service center name or fallback string
 */
export const getServiceCenterName = (code: number | string): string => {
  const numericCode = typeof code === 'string' ? parseInt(code, 10) : code;
  return serviceCenterMap[numericCode] || `Service Center ${code}`;
};

/**
 * Get all codes for a service center by name
 * @param name - Service center name
 * @returns Array of codes for the service center
 */
export const getServiceCenterCodes = (name: string): number[] => {
  const center = serviceCenters.find(sc => sc.name.toLowerCase() === name.toLowerCase());
  return center ? center.codes : [];
};

/**
 * Get service center object by code
 * @param code - Service center code
 * @returns Service center object or null
 */
export const getServiceCenterByCode = (code: number | string): ServiceCenter | null => {
  const numericCode = typeof code === 'string' ? parseInt(code, 10) : code;
  return serviceCenters.find(center => center.codes.includes(numericCode)) || null;
};

/**
 * Check if a code belongs to a specific service center
 * @param code - Service center code
 * @param centerName - Service center name
 * @returns True if code belongs to the service center
 */
export const isCodeForServiceCenter = (code: number | string, centerName: string): boolean => {
  const numericCode = typeof code === 'string' ? parseInt(code, 10) : code;
  const center = serviceCenters.find(sc => sc.name.toLowerCase() === centerName.toLowerCase());
  return center ? center.codes.includes(numericCode) : false;
};

// Export the flat map for backward compatibility
export { serviceCenterMap as default };
