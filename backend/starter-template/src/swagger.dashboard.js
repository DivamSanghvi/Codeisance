export const dashboardSwaggerSpec = {
  openapi: "3.0.0",
  info: { title: "Dashboard APIs", version: "1.0.0" },
  paths: {
    "/api/hospitals/{hospitalId}/inventory/summary": {
      get: {
        summary: "Inventory summary",
        tags: ["Dashboard"],
        parameters: [{ name: "hospitalId", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "OK" } }
      }
    },
    "/api/hospitals/{hospitalId}/inventory/blood-available": {
      get: {
        summary: "Available blood by type",
        tags: ["Dashboard"],
        parameters: [{ name: "hospitalId", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "OK" } }
      }
    },
    "/api/hospitals/{hospitalId}/inventory/organs-available": {
      get: {
        summary: "Available organs by type",
        tags: ["Dashboard"],
        parameters: [{ name: "hospitalId", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "OK" } }
      }
    },
    "/api/hospitals/{hospitalId}/inventory/expiring": {
      get: {
        summary: "Expiry radar counts",
        tags: ["Dashboard"],
        parameters: [
          { name: "hospitalId", in: "path", required: true, schema: { type: "string" } },
          { name: "days", in: "query", required: false, schema: { type: "integer", default: 7 } }
        ],
        responses: { "200": { description: "OK" } }
      }
    },
    "/api/hospitals/{hospitalId}/inventory/usage-series": {
      get: {
        summary: "Daily usage series",
        tags: ["Dashboard"],
        parameters: [
          { name: "hospitalId", in: "path", required: true, schema: { type: "string" } },
          { name: "from", in: "query", required: false, schema: { type: "string", format: "date" } },
          { name: "to", in: "query", required: false, schema: { type: "string", format: "date" } }
        ],
        responses: { "200": { description: "OK" } }
      }
    },
    "/api/hospitals/{hospitalId}/inventory/items": {
      post: {
        summary: "Log donation (add stock)",
        tags: ["Dashboard"],
        parameters: [{ name: "hospitalId", in: "path", required: true, schema: { type: "string" } }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { type: { type: "string", enum: ["BLOOD","ORGAN"] }, bloodType: { type: "string" }, organType: { type: "string" }, quantity: { type: "integer", minimum: 1 }, donatedBy: { type: "string" }, expiresAt: { type: "string", format: "date-time" } }, required: ["type","quantity","expiresAt"] } } } },
        responses: { "201": { description: "Created" }, "400": { description: "Validation error" } }
      }
    },
    "/api/hospitals/{hospitalId}/inventory/items/{itemObjectId}": {
      patch: {
        summary: "Mark item used / update status",
        tags: ["Dashboard"],
        parameters: [
          { name: "hospitalId", in: "path", required: true, schema: { type: "string" } },
          { name: "itemObjectId", in: "path", required: true, schema: { type: "string" } }
        ],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", properties: { status: { type: "string" }, quantityUsed: { type: "integer", minimum: 1 } } } } }
        },
        responses: { "200": { description: "OK" }, "404": { description: "Not found" } }
      }
    },

    "/api/hospitals/{hospitalId}/overview": {
      get: {
        summary: "Overview KPIs",
        tags: ["Dashboard"],
        parameters: [{ name: "hospitalId", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "OK" } }
      }
    },
    "/api/hospitals/{hospitalId}/matches": {
      get: {
        summary: "Active matches table",
        tags: ["Dashboard"],
        parameters: [
          { name: "hospitalId", in: "path", required: true, schema: { type: "string" } },
          { name: "status", in: "query", schema: { type: "string", enum: ["PROPOSED","CONFIRMED","EXPIRED"] }, required: false },
          { name: "sort", in: "query", schema: { type: "string", example: "-createdAt" }, required: false },
          { name: "page", in: "query", schema: { type: "integer", default: 1 }, required: false },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 }, required: false }
        ],
        responses: { "200": { description: "OK" } }
      }
    },
    "/api/hospitals/{hospitalId}/donors-nearby": {
      get: {
        summary: "Nearby donors by hospital location",
        tags: ["Dashboard"],
        parameters: [
          { name: "hospitalId", in: "path", required: true, schema: { type: "string" } },
          { name: "bloodType", in: "query", required: false, schema: { type: "string" } },
          { name: "verifiedOnly", in: "query", required: false, schema: { type: "boolean" } },
          { name: "radiusKm", in: "query", required: false, schema: { type: "number", default: 25 } }
        ],
        responses: { "200": { description: "OK" } }
      }
    },
    "/api/hospitals/{hospitalId}/sos": {
      post: {
        summary: "Create proposed matches to N closest donors",
        tags: ["Dashboard"],
        parameters: [{ name: "hospitalId", in: "path", required: true, schema: { type: "string" } }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { bloodType: { type: "string" }, urgency: { type: "string" }, radiusKm: { type: "number" }, limit: { type: "integer" }, patientId: { type: "string" } }, required: ["bloodType"] } } } },
        responses: { "201": { description: "Created" } }
      }
    },
    "/api/hospitals/{hospitalId}/funnel": {
      get: {
        summary: "Match → Appointment funnel counts",
        tags: ["Dashboard"],
        parameters: [
          { name: "hospitalId", in: "path", required: true, schema: { type: "string" } },
          { name: "from", in: "query", required: false, schema: { type: "string", format: "date" } },
          { name: "to", in: "query", required: false, schema: { type: "string", format: "date" } }
        ],
        responses: { "200": { description: "OK" } }
      }
    },

    "/api/me/summary": { get: { summary: "Donor profile summary", tags: ["Dashboard"], responses: { "200": { description: "OK" } } } },
    "/api/me/availability": {
      patch: {
        summary: "Toggle donor availability",
        tags: ["Dashboard"],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { availabilityStatus: { type: "string", enum: ["available","unavailable"] } }, required: ["availabilityStatus"] } } } },
        responses: { "200": { description: "OK" } }
      }
    },
    "/api/me/appointments/upcoming": { get: { summary: "Next scheduled appointment", tags: ["Dashboard"], responses: { "200": { description: "OK" } } } },
    "/api/me/appointments/history": {
      get: {
        summary: "Past appointments",
        tags: ["Dashboard"],
        parameters: [
          { name: "from", in: "query", required: false, schema: { type: "string", format: "date" } },
          { name: "to", in: "query", required: false, schema: { type: "string", format: "date" } }
        ],
        responses: { "200": { description: "OK" } }
      }
    },
    "/api/me/nearby-requests": {
      get: {
        summary: "Hospitals near donor with shortages for donor's bloodType",
        tags: ["Dashboard"],
        parameters: [{ name: "radiusKm", in: "query", required: false, schema: { type: "number", default: 20 } }],
        responses: { "200": { description: "OK" } }
      }
    },

    "/api/matches/{matchId}": {
      patch: {
        summary: "Confirm a match",
        tags: ["Dashboard"],
        parameters: [{ name: "matchId", in: "path", required: true, schema: { type: "string" } }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { status: { type: "string", enum: ["PROPOSED","CONFIRMED","EXPIRED"] } }, required: ["status"] } } } },
        responses: { "200": { description: "OK" } }
      }
    },
    "/api/appointments": {
      post: {
        summary: "Create appointment for confirmed match",
        tags: ["Dashboard"],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { matchId: { type: "string" }, donorId: { type: "string" }, hospitalId: { type: "string" }, dateTime: { type: "string", format: "date-time" } }, required: ["matchId","donorId","hospitalId","dateTime"] } } } },
        responses: { "201": { description: "Created" } }
      }
    },
    "/api/appointments/{id}": {
      patch: {
        summary: "Update appointment status",
        tags: ["Dashboard"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { status: { type: "string", enum: ["SCHEDULED","COMPLETED","CANCELLED"] } }, required: ["status"] } } } },
        responses: { "200": { description: "OK" } }
      }
    }
  }
};


