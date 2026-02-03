#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";
// Tool registrations
import { registerSchemaDiscoveryTools } from "./tools/schemaDiscovery.js";
import { registerMappingTools } from "./tools/mapping.js";
import { registerTransformationTools } from "./tools/transformation.js";
/**
 * Schema Mapper MCP Server
 *
 * Provides intelligent schema mapping and integration capabilities between
 * disparate API systems with varying schemas.
 */
// Initialize MCP server
const server = new McpServer({
    name: "schema-mapper-mcp-server",
    version: "1.0.0"
});
// Register all tool categories
registerSchemaDiscoveryTools(server);
registerMappingTools(server);
registerTransformationTools(server);
/**
 * Run server with stdio transport (for local/subprocess communication)
 */
async function runStdio() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Schema Mapper MCP server running on stdio");
}
/**
 * Run server with HTTP transport (for remote access)
 */
async function runHTTP() {
    const app = express();
    app.use(express.json());
    // Health check endpoint
    app.get("/health", (_req, res) => {
        res.json({ status: "ok", server: "schema-mapper-mcp-server" });
    });
    // MCP endpoint
    app.post("/mcp", async (req, res) => {
        const transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: undefined,
            enableJsonResponse: true
        });
        res.on("close", () => transport.close());
        await server.connect(transport);
        await transport.handleRequest(req, res, req.body);
    });
    const port = parseInt(process.env.PORT || "3000");
    app.listen(port, () => {
        console.error(`Schema Mapper MCP server running on http://localhost:${port}/mcp`);
    });
}
// Choose transport based on environment
const transport = process.env.TRANSPORT || "stdio";
if (transport === "http") {
    runHTTP().catch(error => {
        console.error("Server error:", error);
        process.exit(1);
    });
}
else {
    runStdio().catch(error => {
        console.error("Server error:", error);
        process.exit(1);
    });
}
//# sourceMappingURL=index.js.map