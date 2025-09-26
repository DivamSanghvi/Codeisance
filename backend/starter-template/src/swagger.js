import swaggerJSDoc from "swagger-jsdoc";
import { dashboardSwaggerSpec } from "./swagger.dashboard.js";

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Community Blood & Organ Donation API",
    version: "1.0.0",
    description: "Hackathon-ready API docs for Inventory, Hospitals, and Patients",
  },
  servers: [
    {
      url: "http://localhost:8000",
      description: "Local server",
    },
  ],
  tags: [
    { name: "Hospital", description: "Hospital API" },
    { name: "Inventory", description: "Inventory API" },
    { name: "Dashboard", description: "Dashboard API" }
  ],
  paths: {
    
    "/api/inventories/{inventoryId}": {
      get: {
        summary: "Get inventory by id",
        tags: ["Inventory"],
        parameters: [{ name: "inventoryId", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "OK" }, "404": { description: "Not found" } },
      },
      delete: {
        summary: "Delete inventory",
        tags: ["Inventory"],
        parameters: [{ name: "inventoryId", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Deleted" }, "404": { description: "Not found" } },
      },
    },
    "/api/inventories/{inventoryId}/items": {
      post: {
        summary: "Add items to inventory (single or bulk)",
        tags: ["Inventory"],
        parameters: [{ name: "inventoryId", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        type: { type: "string", enum: ["BLOOD", "ORGAN"] },
                        bloodType: { type: "string" },
                        organType: { type: "string" },
                        quantity: { type: "integer", minimum: 1 },
                        donatedBy: { type: "string" },
                        receivedAt: { type: "string", format: "date-time" },
                        expiresAt: { type: "string", format: "date-time" }
                      },
                      required: ["type", "quantity", "expiresAt"]
                    },
                  },
                },
                required: ["items"],
              },
              examples: {
                minimalBlood: {
                  summary: "Minimal BLOOD item (no patient)",
                  value: {
                    items: [
                      { type: "BLOOD", bloodType: "A+", quantity: 2, expiresAt: "2025-12-31T00:00:00.000Z" }
                    ]
                  }
                },
                minimalOrgan: {
                  summary: "Minimal ORGAN item",
                  value: {
                    items: [
                      { type: "ORGAN", organType: "Kidney", quantity: 1, expiresAt: "2025-12-31T00:00:00.000Z" }
                    ]
                  }
                },
                mixedBulk: {
                  summary: "Bulk add mixed BLOOD and ORGAN items",
                  value: {
                    items: [
                      { type: "BLOOD", bloodType: "B+", quantity: 3, expiresAt: "2025-11-15T00:00:00.000Z" },
                      { type: "ORGAN", organType: "Cornea", quantity: 1, donatedBy: "66f4a3b2e5a9a1c123456789", expiresAt: "2025-10-20T00:00:00.000Z" }
                    ]
                  }
                }
              }
            },
          },
        },
        responses: { "200": { description: "Updated" }, "400": { description: "Validation error" }, "404": { description: "Not found" } },
      },
    },
    "/api/inventories/{inventoryId}/items/{itemId}/use": {
      post: {
        summary: "Use/consume item quantity",
        tags: ["Inventory"],
        parameters: [
          { name: "inventoryId", in: "path", required: true, schema: { type: "string" } },
          { name: "itemId", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  quantity: { type: "integer", minimum: 1 },
                  patientId: { type: "string" },
                },
                required: ["quantity"],
              },
              examples: {
                withoutPatient: {
                  summary: "Use item without patient",
                  value: { quantity: 1 }
                },
                withPatient: {
                  summary: "Use item and link to a patient",
                  value: { quantity: 2, patientId: "66f4a3b2e5a9a1c987654321" }
                }
              }
            },
          },
        },
        responses: { "200": { description: "Updated" }, "400": { description: "Validation error" }, "404": { description: "Not found" } },
      },
    },
    "/api/inventories/{inventoryId}/items/{itemId}/discard": {
      post: {
        summary: "Discard item (mark EXPIRED)",
        tags: ["Inventory"],
        parameters: [
          { name: "inventoryId", in: "path", required: true, schema: { type: "string" } },
          { name: "itemId", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { reason: { type: "string", enum: ["EXPIRED", "DAMAGED", "OTHER"] } },
              },
              examples: {
                expired: { summary: "Expired item", value: { reason: "EXPIRED" } },
                damaged: { summary: "Damaged item", value: { reason: "DAMAGED" } },
                other: { summary: "Other reason", value: { reason: "OTHER" } }
              }
            },
          },
        },
        responses: { "200": { description: "Updated" }, "404": { description: "Not found" } },
      },
    },
    "/api/inventories/{inventoryId}/stock": {
      get: {
        summary: "Get aggregated stock status",
        tags: ["Inventory"],
        parameters: [{ name: "inventoryId", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "OK" }, "404": { description: "Not found" } },
      },
    },
  },
};

// merge helper
function deepMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (!target[key]) target[key] = {};
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

const mergedDefinition = deepMerge(JSON.parse(JSON.stringify(swaggerDefinition)), dashboardSwaggerSpec);

export const swaggerSpec = swaggerJSDoc({
  definition: mergedDefinition,
  apis: [],
});


