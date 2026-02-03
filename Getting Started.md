# Getting Started with Schema Mapper MCP Server

This guide walks you through setting up and using the Schema Mapper MCP Server step-by-step.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Basic understanding of REST APIs
- (Optional) Claude Desktop or another MCP client

## Installation

### Step 1: Install Dependencies

```bash
cd schema-mapper-mcp-server
npm install
```

This installs all required packages:
- `@modelcontextprotocol/sdk` - MCP protocol implementation
- `express` - HTTP server (for HTTP mode)
- `axios` - HTTP client for fetching schemas
- `zod` - Input validation
- TypeScript and dev dependencies

### Step 2: Build the Project

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` folder.

### Step 3: Verify Installation

```bash
npm start
```

You should see:
```
Schema Mapper MCP server running on stdio
```

Press `Ctrl+C` to stop.

## Usage Methods

There are **three main ways** to use this MCP server:

### Method 1: With Claude Desktop (Recommended for Testing)

#### Configure Claude Desktop

1. **Locate the config file**:
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
   - Linux: `~/.config/Claude/claude_desktop_config.json`

2. **Add the server configuration**:
```json
{
  "mcpServers": {
    "schema-mapper": {
      "command": "node",
      "args": ["/absolute/path/to/schema-mapper-mcp-server/dist/index.js"],
      "env": {
        "TRANSPORT": "stdio"
      }
    }
  }
}
```

3. **Replace the path** with your actual path to `dist/index.js`

4. **Restart Claude Desktop**

5. **Test it**: In Claude, type:
   ```
   Can you list the available schema mapping tools?
   ```

Claude should show all 12 tools available.

### Method 2: With MCP Inspector (Best for Development)

The MCP Inspector lets you test tools interactively:

```bash
# Install the inspector globally
npm install -g @modelcontextprotocol/inspector

# Run the inspector
npx @modelcontextprotocol/inspector node dist/index.js
```

This opens a web interface at `http://localhost:5173` where you can:
- Browse available tools
- Test tool calls with parameters
- See responses in real-time
- Debug issues

### Method 3: HTTP Mode (For REST API Integration)

Run the server in HTTP mode:

```bash
TRANSPORT=http PORT=3000 npm start
```

Server runs at `http://localhost:3000/mcp`

Test with curl:
```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "params": {},
    "id": 1
  }'
```

## Walkthrough: Your First Integration

Let's map a customer API to a user API step-by-step.

### Scenario: CRM Integration

**System A** (Salesforce-like): Well-defined customer API
**System B** (HubSpot-like): User management API

### Step 1: Prepare Test Schemas

For this tutorial, we'll use mock schemas. Create two files:

**system-a-schema.json**:
```json
{
  "openapi": "3.0.0",
  "info": { "version": "1.0.0", "title": "System A" },
  "paths": {
    "/customers": {
      "post": {
        "summary": "Create customer",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "FirstName": { "type": "string" },
                  "LastName": { "type": "string" },
                  "Email": { "type": "string" },
                  "Phone": { "type": "string" },
                  "CompanyName": { "type": "string" }
                },
                "required": ["FirstName", "LastName", "Email"]
              }
            }
          }
        }
      }
    }
  }
}
```

**system-b-schema.json**:
```json
{
  "openapi": "3.0.0",
  "info": { "version": "1.0.0", "title": "System B" },
  "paths": {
    "/users": {
      "post": {
        "summary": "Create user",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "first_name": { "type": "string" },
                  "last_name": { "type": "string" },
                  "email_address": { "type": "string" },
                  "telephone": { "type": "string" },
                  "company": { "type": "string" }
                },
                "required": ["first_name", "last_name", "email_address"]
              }
            }
          }
        }
      }
    }
  }
}
```

Serve these files with a simple HTTP server:
```bash
# In the directory with the JSON files
python3 -m http.server 8080
```

Now they're available at:
- `http://localhost:8080/system-a-schema.json`
- `http://localhost:8080/system-b-schema.json`

### Step 2: Using with Claude Desktop

Open Claude and say:

```
I need to set up API integration between two systems. Can you help me map their schemas?

First, load System A schema from: http://localhost:8080/system-a-schema.json
```

Claude will use the `schema_load_system_a` tool.

Then:
```
Now load System B schema from: http://localhost:8080/system-b-schema.json
```

### Step 3: Generate Mapping Suggestions

Ask Claude:
```
Can you suggest field mappings between the /customers endpoint in System A 
and the /users endpoint in System B? I want to see mappings with at least 
70% confidence.
```

Claude will use `mapping_suggest` and show you results like:

```
Mapping Suggestions:

1. FirstName → first_name
   - Confidence: 95.0%
   - Reasoning: Field names are synonyms; Same data type
   
2. LastName → last_name
   - Confidence: 95.0%
   - Reasoning: Field names are synonyms; Same data type
   
3. Email → email_address
   - Confidence: 88.5%
   - Reasoning: Field names are synonyms; Same data type
   
4. Phone → telephone
   - Confidence: 85.0%
   - Reasoning: Field names are synonyms; Same data type
   
5. CompanyName → company
   - Confidence: 82.3%
   - Reasoning: Field names match after normalization; Same data type
```

### Step 4: Save the Mapping

Tell Claude:
```
Great! Please save this mapping with ID "salesforce-hubspot-sync" 
and name "Salesforce to HubSpot Customer Sync"
```

Claude will construct the field mappings JSON and call `mapping_save`.

### Step 5: Transform Data

Now test the transformation:
```
Can you transform this System A customer data to System B format:

{
  "FirstName": "Jane",
  "LastName": "Smith",
  "Email": "jane.smith@acme.com",
  "Phone": "+1-555-0123",
  "CompanyName": "Acme Corp"
}

Use the mapping we just saved.
```

Claude will use `transform_a_to_b` and return:

```json
{
  "success": true,
  "transformedPayload": {
    "first_name": "Jane",
    "last_name": "Smith",
    "email_address": "jane.smith@acme.com",
    "telephone": "+1-555-0123",
    "company": "Acme Corp"
  }
}
```

### Step 6: Verify and Use

You can now:
- List all saved mappings: "Show me all my saved mappings"
- Validate a mapping: "Validate the salesforce-hubspot-sync mapping"
- Generate test data: "Generate example payload for testing"

## Using the MCP Inspector

The Inspector provides a visual interface:

1. **Start the inspector**:
```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

2. **Open browser** to `http://localhost:5173`

3. **Click "Connect"**

4. **Browse Tools** in the left sidebar

5. **Test a tool**:
   - Click `schema_load_system_a`
   - Fill in parameters:
     ```json
     {
       "url": "http://localhost:8080/system-a-schema.json",
       "response_format": "markdown"
     }
     ```
   - Click "Call Tool"
   - See the response

6. **Try each tool** to understand what it does

## Common Workflows

### Workflow 1: One-Time Migration

```
1. Load both schemas
2. Generate mapping suggestions
3. Review and adjust mappings
4. Save mapping configuration
5. Transform all records
```

### Workflow 2: Ongoing Synchronization

```
1. Load and save mapping once
2. For each sync:
   - Load saved mapping
   - Transform payload
   - Validate result
   - Send to target system
```

### Workflow 3: Testing & Validation

```
1. Load schemas
2. Generate example payload
3. Transform to target format
4. Validate mapping
5. Fix any issues
6. Save final mapping
```

## Practical Examples from EXAMPLES.md

The `EXAMPLES.md` file contains **6 detailed scenarios**:

1. **CRM Integration** (Salesforce → HubSpot)
2. **E-commerce Migration** (Shopify → WooCommerce)
3. **Payment Gateway** (Stripe → PayPal)
4. **Inventory Management** (Multi-warehouse sync)
5. **Date Format Conversions**
6. **Array/String Conversions**

### How to Use an Example

Let's use **Example 1: CRM Integration**

1. **Open EXAMPLES.md** and find "Scenario 1: CRM Integration"

2. **Follow the commands** shown - each one is a tool call you can make

3. **In Claude Desktop**, just describe what you want:
   ```
   I want to set up the Salesforce to HubSpot integration 
   from Example 1 in the EXAMPLES.md file
   ```

4. **Claude will**:
   - Read the example
   - Execute the appropriate tools
   - Guide you through the process

5. **Copy the JSON payloads** from the examples when asked

### Adapting Examples to Your Needs

Each example shows:
- **Field mappings** - Adjust field names for your APIs
- **Transformations** - Copy transformation rules you need
- **Payloads** - Use as templates for your data

For instance, if your system uses `customer_email` instead of `Email`:
```
Just tell Claude: "Use the CRM example but change Email to customer_email"
```

## Troubleshooting

### Issue: "Cannot find module '@modelcontextprotocol/sdk'"

**Solution**: Run `npm install` in the project directory

### Issue: "Schema loading failed"

**Solution**: 
- Verify the URL is accessible
- Check if it returns valid JSON
- Ensure it's a proper OpenAPI/JSON schema

### Issue: "No mapping suggestions found"

**Solution**:
- Lower confidence threshold (try 0.5 instead of 0.7)
- Check if schemas were loaded correctly
- Verify endpoint paths and methods are correct

### Issue: "Transformation errors"

**Solution**:
- Check the field mapping types match
- Verify required fields are present
- Look at the error details for specific fields

### Issue: "Tool not found"

**Solution**:
- Restart Claude Desktop
- Check the config file path is correct
- Verify the build completed successfully

## Tips for Success

1. **Start Simple**: Begin with basic field mappings before complex transformations

2. **Test Incrementally**: Transform one record before processing many

3. **Use Markdown Format**: Better for reviewing in Claude
   ```
   response_format: "markdown"
   ```

4. **Save Often**: Save working mappings as you build them

5. **Document**: Add descriptions to your mappings for future reference

6. **Validate**: Always validate mappings before production use

## Next Steps

Once you're comfortable with the basics:

1. **Read ARCHITECTURE.md** - Understand how it works internally
2. **Explore Advanced Features** - Custom transformations, validation rules
3. **Extend the Server** - Add new tools or transformation types
4. **Integrate with Your Systems** - Use in production workflows

## Getting Help

- **Check the README.md** - Comprehensive documentation
- **Review EXAMPLES.md** - Real-world scenarios
- **Use MCP Inspector** - Debug tool calls
- **Ask Claude** - When using Claude Desktop, just describe what you need

## Quick Reference Card

```bash
# Build
npm run build

# Run stdio (for MCP clients)
npm start

# Run HTTP (for REST APIs)
TRANSPORT=http PORT=3000 npm start

# Test with Inspector
npx @modelcontextprotocol/inspector node dist/index.js

# Development mode (auto-reload)
npm run dev
```

### Most Used Tools

1. `schema_load_system_a` - Load first schema
2. `schema_load_system_b` - Load second schema
3. `mapping_suggest` - Get AI suggestions
4. `mapping_save` - Save configuration
5. `transform_a_to_b` - Convert data

Start with these five and you can accomplish most tasks!