# Pillar Configuration

This application uses a simple file-based configuration system for pillar colors and icons. All configuration is managed by mapping pillar IDs to colors and icons.

## Configuration File

The main configuration is in `config/pillar-config.ts`. This file contains a simple ID-to-config mapping.

## How to Configure Pillars

### 1. Open the configuration file
```
config/pillar-config.ts
```

### 2. Add your pillar IDs with their colors and icons
```typescript
export const PILLAR_CONFIGS: Record<string, PillarConfig> = {
  "SPill100": {
    colorHex: "#68d2df", // Light blue
    iconPath: "/icons/precision-medicine.png"
  },
  "SPill101": {
    colorHex: "#d0006f", // Magenta/pink
    iconPath: "/icons/pipeline.png"
  },
  "SPill102": {
    colorHex: "#c4d600", // Lime green
    iconPath: "/icons/people.png"
  }
}
```

## Finding Your Pillar IDs

To find your pillar IDs, you can:
1. Check your database's `strategic_pillars` table
2. Look at the API response from `/api/scorecard`
3. Use browser dev tools to inspect the pillar objects in the UI

## Adding Icons

1. **Place icon files** in the `/public/icons/` directory
2. **Reference them** in the config as `/icons/your-icon.png`
3. **Supported formats**: PNG, SVG, JPG

Available icons:
- `/icons/precision-medicine.png`
- `/icons/pipeline.png`
- `/icons/people.png`

## Color Format

Use standard hex color codes:
- `#d0006f` (magenta/pink)
- `#68d2df` (light blue)  
- `#c4d600` (lime green)

The system automatically generates Tailwind CSS classes like `bg-[#d0006f]`.

## Example for Your Work Database

Replace the IDs below with your actual pillar IDs:

```typescript
export const PILLAR_CONFIGS: Record<string, PillarConfig> = {
  "YourPillarId1": {
    colorHex: "#d0006f",
    iconPath: "/icons/pipeline.png"
  },
  "YourPillarId2": {
    colorHex: "#68d2df", 
    iconPath: "/icons/precision-medicine.png"
  },
  "YourPillarId3": {
    colorHex: "#c4d600",
    iconPath: "/icons/people.png"
  }
}
```

## How It Works

1. Components pass the pillar ID to utility functions
2. The system looks up the ID in `PILLAR_CONFIGS`
3. If found, returns the configured color and icon
4. If not found, uses default gray color

## Files Involved

- `config/pillar-config.ts` - Main configuration file (ID → config mapping)
- `lib/pillar-utils.ts` - Utility functions for getting colors by ID
- `components/pillar-icon.tsx` - Icon component using pillar ID
- `components/scorecard.tsx` - Main scorecard using color utilities
- `app/details/page.tsx` - Details page using color utilities

## Troubleshooting

1. **Colors not showing**: Check that your pillar ID exists in `PILLAR_CONFIGS`
2. **Icons not displaying**: Check that the icon file exists in `/public/icons/`
3. **Wrong colors**: Verify the pillar ID spelling matches exactly
4. **Tailwind classes not working**: The arbitrary value syntax `bg-[#hexcolor]` should work automatically

Simple and clean - just map your pillar IDs to colors and icons!