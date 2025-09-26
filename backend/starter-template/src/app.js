import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import fs from 'fs';
import hospitalRoutes from "./routes/Hospital.route.js"

import userRoutes from "./routes/Auth.route.js";
import swaggerUi from 'swagger-ui-express';
import inventoryRoutes from "./routes/inventory.routes.js";
import dashboardRoutes from "./routes/Dashboard.route.js";
import { swaggerSpec } from "./swagger.js";

const swaggerDocument = JSON.parse(fs.readFileSync(new URL('../swagger.json', import.meta.url), 'utf8'));

function mergeSwagger(baseDoc, extraSpec) {
  const merged = { ...baseDoc };
  merged.openapi = merged.openapi || extraSpec.openapi || '3.0.0';
  merged.info = merged.info || extraSpec.info;
  merged.paths = { ...(baseDoc.paths || {}), ...(extraSpec.paths || {}) };
  merged.components = {
    ...(baseDoc.components || {}),
    schemas: { ...((baseDoc.components || {}).schemas || {}), ...((extraSpec.components || {}).schemas || {}) },
    securitySchemes: { ...((baseDoc.components || {}).securitySchemes || {}), ...((extraSpec.components || {}).securitySchemes || {}) },
  };
  return merged;
}

const combinedSwaggerSpec = mergeSwagger(swaggerDocument, swaggerSpec);
const app = express()

app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true
}))

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())


//routes declaration
import patientRoutes from './routes/Patient.route.js';

app.use('/api/hospitals', hospitalRoutes);
app.use('/api/patients', patientRoutes);
app.use("/api/users", userRoutes);
app.use("/api/inventories", inventoryRoutes);
app.use("/api", dashboardRoutes);

// Swagger docs (merged: existing swagger.json + inventory spec)
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(combinedSwaggerSpec));

// Health check route
app.get("/", (req, res) => {
  res.send("Community Blood & Organ Donation API is running ✅");
});

// http://localhost:8000/api/v1/users/register

// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: err.message || 'Internal Server Error'
    });
});

export { app }
