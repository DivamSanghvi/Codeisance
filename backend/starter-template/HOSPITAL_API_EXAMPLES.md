# Hospital CRUD API Examples

## Base URL
```
http://localhost:8000/api/hospitals
```

## 1. Create Hospital
```bash
curl -X POST http://localhost:8000/api/hospitals \
  -H "Content-Type: application/json" \
  -d '{
    "name": "City General Hospital",
    "type": "HOSPITAL",
    "licenseNo": "LIC123456",
    "contact": {
      "phone": "+91-9876543210",
      "email": "info@citygeneral.com"
    },
    "address": {
      "line1": "123 Main Street",
      "line2": "Near Central Park",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400001",
      "country": "India"
    },
    "location": {
      "type": "Point",
      "coordinates": [72.8385708, 19.2072946]
    },
    "services": ["Emergency", "Surgery", "Blood Bank"]
  }'
```

## 2. Get Hospitals (List with pagination)
```bash
# Basic list
curl -X GET "http://localhost:8000/api/hospitals?page=1&limit=10"

# Search by name or city
curl -X GET "http://localhost:8000/api/hospitals?q=General"

# Filter by city
curl -X GET "http://localhost:8000/api/hospitals?city=Mumbai"

# Filter by type
curl -X GET "http://localhost:8000/api/hospitals?type=HOSPITAL"

# Filter by service
curl -X GET "http://localhost:8000/api/hospitals?service=Blood%20Bank"

# Geo search (within 10km of coordinates)
curl -X GET "http://localhost:8000/api/hospitals?nearLon=72.8385708&nearLat=19.2072946&nearKm=10"

# Include inactive hospitals
curl -X GET "http://localhost:8000/api/hospitals?includeInactive=1"
```

## 3. Get Hospital by ID
```bash
curl -X GET http://localhost:8000/api/hospitals/{hospital_id}
```

## 4. Update Hospital (Partial)
```bash
curl -X PATCH http://localhost:8000/api/hospitals/{hospital_id} \
  -H "Content-Type: application/json" \
  -d '{
    "contact": {
      "phone": "+91-9876543211"
    },
    "services": ["Emergency", "Surgery", "Blood Bank", "ICU"]
  }'
```

## 5. Delete Hospital (Soft delete)
```bash
curl -X DELETE http://localhost:8000/api/hospitals/{hospital_id}
```

## Response Format
All responses follow this structure:
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

For list endpoints:
```json
{
  "success": true,
  "data": [ ... ],
  "page": 1,
  "limit": 20,
  "total": 100
}
```

## Error Response
```json
{
  "success": false,
  "message": "Error description",
  "details": ["Validation error 1", "Validation error 2"]
}
```

## Validation Rules
- Name: 2-120 characters, required
- Type: HOSPITAL, BLOOD_BANK, or CLINIC
- LicenseNo: Required, unique string
- Address: All fields required (line1, city, state, pincode, country)
- Location: Valid GeoJSON Point with [longitude, latitude]
- Services: Array of strings (optional)
- Coordinates: Longitude -180 to 180, Latitude -90 to 90

## Notes
- All coordinates are in [longitude, latitude] format
- Soft delete sets `isActive: false`
- By default, only active hospitals are returned
- Use `includeInactive=1` to include inactive hospitals
- Pagination starts from page 1
- Max limit is 100 per page
