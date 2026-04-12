export const SERVICE_CATEGORIES = {
  'Domestic Cleaning': [
    'Regular House Cleaning',
    'Deep Cleaning',
    'Spring Cleaning',
    'End of Tenancy',
    'After-party Cleaning',
    'Holiday Let Cleaning',
  ],
  'Specialist Cleaning': [
    'Oven Cleaning',
    'Carpet Cleaning',
    'Upholstery Cleaning',
    'Mattress Cleaning',
    'Curtain Cleaning',
    'Mould Removal',
  ],
  'Exterior Cleaning': ['Window Cleaning', 'Gutter Cleaning', 'Roof Cleaning', 'Pressure Washing'],
  'Vehicle Cleaning': ['Car Valeting', 'Fleet Cleaning'],
  'Commercial Cleaning': ['Office Cleaning', 'Retail Cleaning', 'Gym Cleaning'],
};

export const ALL_SERVICE_OPTIONS = Object.values(SERVICE_CATEGORIES).flat();
