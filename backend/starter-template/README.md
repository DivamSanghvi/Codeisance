# Community Blood & Organ Donation API

A production-ready Node.js backend service for managing hospitals and facilitating blood donation matching between patients and donors. Built with Express.js, MongoDB, and Mongoose for a 24-hour hackathon.

## Features

### Hospital Management
- **CRUD Operations**: Create, read, update, delete hospitals
- **Advanced Search**: Filter by city, type, services; geo queries with near location
- **Pagination**: Configurable page/limit with max 100 per page
- **Validation**: Comprehensive input validation with detailed error messages
- **Normalization**: Auto-trim, uppercase enums/countries, pincode as string
- **Indexes**: Optimized for search and geo queries

### Patient-Donor Matching System
- **Blood Compatibility**: ABO/Rh type matching using medical standards
- **Smart Matching**: Geo-proximity (10km radius), donor eligibility checks
- **Ranking Algorithm**: Prioritizes closest donors, then by donation history
- **Proposal System**: Batched notifications with 24-hour TTL tokens
- **Agentic Rechecks**: Automatic follow-ups every 30 minutes if shortages persist
- **Confirmation Flow**: Secure token-based confirmations creating appointments

## Tech Stack
- **Runtime**: Node.js (ESM)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Validation**: Custom middleware (no external libs for simplicity)
- **Geo Queries**: MongoDB 2dsphere indexes
- **Scheduling**: Built-in setInterval for agentic tasks

## Project Structure

```
backend/starter-template/
├── src/
│   ├── app.js                 # Express app setup, middleware, routes
│   ├── index.js               # Server entry point with DB connection
│   ├── db/index.js            # MongoDB connection
│   ├── constants.js           # App constants
│   ├── models/
│   │   ├── Hospital.js        # Hospital schema with geo/location
│   │   ├── Patient.js         # Patient requirements schema
│   │   ├── User.js            # Donor schema (extended from existing)
│   │   ├── Match.js           # Proposal/confirmation schema
│   │   └── Appointment.js     # Donation scheduling schema
│   ├── controllers/
│   │   ├── Hospital.controller.js  # CRUD handlers with pagination/geo
│   │   └── Patient.controller.js   # Matching logic, confirmations, rechecks
│   ├── routes/
│   │   ├── Hospital.route.js   # Hospital API endpoints
│   │   └── Patient.route.js    # Patient matching endpoints
│   ├── middlewares/
│   │   └── validate.js         # Input validation middleware
│   └── utils/
│       └── bloodCompatibility.js  # Blood type compatibility logic
├── package.json               # Dependencies and scripts
├── .env                       # Environment variables
└── README.md                  # This file
```

## Installation & Setup

1. **Clone and Navigate**:
   ```bash
   cd backend/starter-template
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Environment Variables**:
   Create `.env` file:
   ```
   MONGODB_URI=mongodb://localhost:27017
   DB_NAME=blood_donation
   PORT=8000
   CORS_ORIGIN=http://localhost:3000
   ```

4. **Start MongoDB**:
   Ensure MongoDB is running locally or update URI for Atlas.

5. **Run the Server**:
   ```bash
   npm start
   # or for development: node src/index.js
   ```

## API Endpoints

### Hospital Management
All routes prefixed with `/api/hospitals`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create new hospital |
| GET | `/` | List hospitals with filters/pagination |
| GET | `/:id` | Get hospital by ID |
| PATCH | `/:id` | Update hospital (partial) |
| DELETE | `/:id` | Soft delete hospital |

**Query Parameters for GET /**:
- `page`, `limit`: Pagination (default 1, 20; max 100)
- `q`: Search name or city (case-insensitive)
- `city`, `type`, `service`: Exact filters
- `nearLon`, `nearLat`, `nearKm`: Geo search
- `includeInactive`: Include soft-deleted (default false)

### Patient Matching
All routes prefixed with `/api/patients`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Register patient and initiate donor matching |
| GET | `/:hospitalId` | List patients for a hospital |
| POST | `/confirm/:token` | Confirm donation proposal |

## Data Models

### Hospital
```javascript
{
  name: String (required, 2-120 chars),
  type: Enum ["HOSPITAL", "BLOOD_BANK", "CLINIC"],
  licenseNo: String (required, unique),
  contact: { phone?, email? },
  address: {
    line1, line2?, city, state, pincode, country (all required except line2)
  },
  location: GeoJSON Point { coordinates: [lon, lat] },
  services: [String],
  isActive: Boolean (default true)
}
```

### Patient
```javascript
{
  hospitalId: ObjectId,
  name: String,
  bloodType: Enum ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
  unitsNeeded: Number,
  status: Enum ["PENDING", "FULFILLED"],
  confirmedCount: Number
}
```

### User (Donor)
```javascript
{
  // Existing fields: name, phone, email?, age, gender, bloodType, etc.
  isVerifiedDonor: Boolean,
  location: GeoJSON Point,
  lastDonationAt: Date,
  lastPingedAt: Date
}
```

### Match
```javascript
{
  patientId: ObjectId,
  donorId: ObjectId,
  status: Enum ["PROPOSED", "CONFIRMED", "EXPIRED"],
  token: String (unique),
  expiresAt: Date (TTL 24h)
}
```

### Appointment
```javascript
{
  matchId: ObjectId,
  donorId: ObjectId,
  hospitalId: ObjectId,
  dateTime: Date,
  status: Enum ["SCHEDULED", "COMPLETED", "CANCELLED"]
}
```

## Blood Compatibility Rules

Donors can give to patients based on ABO/Rh compatibility:

- **O-** → All types
- **O+** → O+, A+, B+, AB+
- **A-** → A-, A+, AB-, AB+
- **A+** → A+, AB+
- **B-** → B-, B+, AB-, AB+
- **B+** → B+, AB+
- **AB-** → AB-, AB+
- **AB+** → AB+

## Matching Algorithm

1. **Eligibility Filter**:
   - Donor verified and eligible (last donation >90 days ago)
   - Not pinged in last 14 days
   - Within 10km of hospital or same hospitalId

2. **Compatibility Check**: Blood types must match per rules

3. **Ranking**:
   - Distance ascending
   - Last donation date ascending (prefer long-time donors)
   - Random for ties

4. **Proposal Creation**:
   - Top 30 candidates
   - Generate unique tokens
   - TTL expires in 24 hours
   - Mock SMS notifications

5. **Confirmation**:
   - Token validation
   - Create next-day appointment
   - Increment patient confirmedCount

6. **Agentic Rechecks**:
   - Every 30 minutes
   - If confirmedCount < unitsNeeded
   - Find new donors (exclude previously proposed)
   - Expand radius to 25km
   - Send additional batches

## Sample API Usage

### Create Hospital
```bash
curl -X POST http://localhost:8000/api/hospitals \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Metro Blood Center",
    "licenseNo": "LIC789012",
    "address": {
      "line1": "456 Health Ave",
      "city": "Los Angeles",
      "state": "CA",
      "pincode": "90210",
      "country": "USA"
    },
    "location": {
      "type": "Point",
      "coordinates": [-118.2437, 34.0522]
    },
    "services": ["BLOOD_BANK", "EMERGENCY"]
  }'
```

### Register Patient (Triggers Matching)
```bash
curl -X POST http://localhost:8000/api/patients \
  -H "Content-Type: application/json" \
  -d '{
    "hospitalId": "64f1a2b3c4d5e6f7g8h9i0j1",
    "name": "Alice Johnson",
    "bloodType": "B+",
    "unitsNeeded": 3
  }'
```

### Confirm Donation
```bash
curl -X POST http://localhost:8000/api/patients/confirm/abc123def456ghi789...
```

## Error Handling

All errors return JSON:
```json
{
  "success": false,
  "message": "Error description",
  "details": ["Field-specific errors"]
}
```

Success responses:
```json
{
  "success": true,
  "data": { ... },
  "page": 1,
  "limit": 20,
  "total": 100
}
```

## Security & Best Practices

- Input validation on all endpoints
- MongoDB injection prevention via Mongoose
- Soft deletes for data integrity
- Token-based confirmations for security
- Geo queries optimized with 2dsphere indexes
- Async/await with proper error handling
- Environment-based configuration

## Future Enhancements

- Inventory management for blood units
- Real SMS/Push notifications
- Advanced scheduling algorithms
- Donor reward systems
- Analytics dashboard
- Multi-language support

## Contributing

1. Fork the repository
2. Create feature branch
3. Add tests for new features
4. Ensure all validations pass
5. Submit pull request

## License

MIT License - Free to use for hackathons and open-source projects.
