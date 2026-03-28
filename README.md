# AI-Powered Inventory Assistant

### MuleSoft MCP + Salesforce + Claude AI

Query your Salesforce inventory using **plain English** with the power of AI.

>  *“What’s the stock for Smart Sensor?”*
>  Get real-time data directly from Salesforce — no manual navigation needed.

---

##  Overview

This project demonstrates how to connect an AI model (**Claude AI**) with a live **Salesforce** database using **MuleSoft's Model Context Protocol (MCP)**.

Instead of building custom chatbot logic, we expose MuleSoft APIs as **AI-discoverable tools**, allowing the AI to decide **when and how to call them**.

---

##  Architecture

```
Claude AI (Client)
        │
        ▼
MCP Protocol (Tool Discovery)
        │
        ▼
MuleSoft MCP Server (Middleware)
        │
        ▼
Salesforce (Product2 Object)
```

---

##  Tech Stack

*  MuleSoft (MCP Connector)
*  Claude AI (Anthropic)
*  Salesforce (Product2 Object)
*  DataWeave (Transformation)
*  HTTP Listener (API Exposure)
*  MCP Inspector (Testing Tool)

---

##  Features

*  Query Salesforce using natural language
*  MCP-based tool discovery (no hardcoding in AI)
*  Real-time inventory lookup
*  Clean separation of AI + business logic
*  Extensible architecture (add more tools easily)

---

##  How It Works

### 1. MCP Tool Exposure

The MuleSoft flow is exposed as a tool using `mcp:tool-listener`.

* Tool Name: `get_product_inventory`
* Input: `productName`
* Output: Plain text response

---

### 2. AI Request Flow

1. User asks Claude:

   > “What’s the stock for Smart Sensor?”
2. Claude discovers the MCP tool
3. Calls MuleSoft with `productName`
4. MuleSoft queries Salesforce
5. Returns formatted response
6. Claude displays the result

---

## 🛠️ MuleSoft Configuration

### HTTP Listener

```xml
<http:listener-config name="HTTP_Listener_config">
  <http:listener-connection host="0.0.0.0" port="8081"/>
</http:listener-config>
```

### MCP Server Config

```xml
<mcp:server-config name="MCP_Server"
  serverName="base-mcp1"
  serverVersion="1.00">
  <mcp:streamable-http-server-connection
    listenerConfig="HTTP_Listener_config"
    responseContentType="JSON"/>
</mcp:server-config>
```

---

### MCP Tool Listener

```xml
<mcp:tool-listener 
  config-ref="MCP_Server" 
  name="get_product_inventory">

  <mcp:description>
    Checks Salesforce for product stock info by product name
  </mcp:description>

  <mcp:parameters-schema>
  {
    "type": "object",
    "properties": {
      "productName": {
        "type": "string"
      }
    },
    "required": ["productName"]
  }
  </mcp:parameters-schema>

  <mcp:responses>
    <mcp:text-tool-response-content text="#[payload]"/>
  </mcp:responses>

</mcp:tool-listener>
```

---

##  Salesforce Integration

* Connector: Salesforce Connector (Basic Auth)
* Query:

```sql
SELECT Name, ProductCode, Description 
FROM Product2 
WHERE Name = :productName
```

---

##  Data Transformation (DataWeave)

* Formats Salesforce response into readable text
* Handles null values with defaults
* Ensures AI-friendly output

---

##  Testing

### MCP Inspector

```bash
npx @modelcontextprotocol/inspector
```

* Open: `http://localhost:8081/mcp`
* Go to **Tools tab**
* Call `get_product_inventory`

---

## Claude Desktop Integration

Update config file:

```
%APPDATA%\Claude\claude_desktop_config.json
```

```json
{
  "mcpServers": {
    "mulesoft-inventory": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "http://localhost:8081/mcp"
      ]
    }
  }
}
```

Restart Claude → 🔨 Tool icon appears.

---

## 📌 Key Learnings

*  AI doesn’t need hardcoded logic to call APIs
*  MCP enables dynamic tool discovery
*  MuleSoft acts as a secure middleware layer
*  Easily extendable (add more tools like `create_support_case`)

---

##  Future Improvements

*  Add stock quantity field
*  Dashboard for inventory insights
*  OAuth-based Salesforce authentication
*  Multiple product search support
*  Multi-tool AI workflows

---

##  Author

**Arnab Das**
Full Stack Developer | AI + DevOps Enthusiast

---

