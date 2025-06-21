# Location Data Guide for Bengal Heritage App

## GeoJSON Format

When submitting location data via API or form submission, you must follow the GeoJSON format:

```json
{
  "type": "Point",
  "coordinates": [longitude, latitude]
}
```

### Important Rules:

1. Coordinates order is [longitude, latitude] - not the other way around!
2. Longitude must be between -180 and 180 degrees
3. Latitude must be between -90 and 90 degrees

### Examples:

- Kolkata: `{"type":"Point","coordinates":[88.3639, 22.5726]}`
- Dhaka: `{"type":"Point","coordinates":[90.4125, 23.8103]}`
- Chittagong: `{"type":"Point","coordinates":[91.8209, 22.3475]}`

### Form Data Submission:

When using form-data in Postman or similar tools:

**Option 1:** Send as JSON string

```
location: {"type":"Point","coordinates":[88.3639, 22.5726]}
```

**Option 2:** Send as separate fields

```
location[type]: Point
location[coordinates][0]: 88.3639
location[coordinates][1]: 22.5726
```

## Common Errors:

1. **Coordinates Out of Bounds:**

   - Latitude exceeds 90° (must be -90° to 90°)
   - Longitude exceeds 180° (must be -180° to 180°)

2. **Reversed Coordinates:**

   - Remember GeoJSON uses [longitude, latitude] order
   - This is opposite to the common [latitude, longitude] format used in GPS

3. **Missing Type:**
   - The "type" field must be set to "Point"
