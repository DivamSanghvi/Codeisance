import swaggerJSDoc from "swagger-jsdoc";

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
  components: {
    schemas: {
      InventoryItemInput: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["BLOOD", "ORGAN"] },
          bloodType: { type: "string", enum: ["A+","A-","B+","B-","AB+","AB-","O+","O-"] },
          organType: { type: "string", enum: ["Kidney","Liver","Heart","Lungs","Pancreas","Cornea","Bone Marrow","Other"] },
          quantity: { type: "integer", minimum: 1 },
          donatedBy: { type: "string" },
          patient: { type: "string" },
          receivedAt: { type: "string", format: "date-time" },
          expiresAt: { type: "string", format: "date-time" },
        },
        required: ["type", "quantity", "expiresAt"],
      },
    },
  },
  paths: {
    "/api/inventories": {
      post: {
        summary: "Create inventory for a hospital",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { hospitalId: { type: "string" } },
                required: ["hospitalId"],
              },
            },
          },
        },
        responses: { "201": { description: "Created" }, "400": { description: "Validation error" }, "404": { description: "Not found" } },
      },
    },
    "/api/inventories/{inventoryId}": {
      get: {
        summary: "Get inventory by id",
        parameters: [{ name: "inventoryId", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "OK" }, "404": { description: "Not found" } },
      },
      delete: {
        summary: "Delete inventory",
        parameters: [{ name: "inventoryId", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Deleted" }, "404": { description: "Not found" } },
      },
    },
    "/api/inventories/{inventoryId}/items": {
      post: {
        summary: "Add items to inventory (single or bulk)",
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
                    items: { $ref: "#/components/schemas/InventoryItemInput" },
                  },
                },
                required: ["items"],
              },
            },
          },
        },
        responses: { "200": { description: "Updated" }, "400": { description: "Validation error" }, "404": { description: "Not found" } },
      },
    },
    "/api/inventories/{inventoryId}/items/{itemId}/use": {
      post: {
        summary: "Use/consume item quantity",
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
            },
          },
        },
        responses: { "200": { description: "Updated" }, "400": { description: "Validation error" }, "404": { description: "Not found" } },
      },
    },
    "/api/inventories/{inventoryId}/items/{itemId}/discard": {
      post: {
        summary: "Discard item (mark EXPIRED)",
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
            },
          },
        },
        responses: { "200": { description: "Updated" }, "404": { description: "Not found" } },
      },
    },
    "/api/inventories/{inventoryId}/stock": {
      get: {
        summary: "Get aggregated stock status",
        parameters: [{ name: "inventoryId", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "OK" }, "404": { description: "Not found" } },
      },
    },
  },
};

export const swaggerSpec = swaggerJSDoc({
  definition: swaggerDefinition,
  apis: [],
});


