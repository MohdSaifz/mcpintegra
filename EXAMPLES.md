# Example Usage Scenarios

This document provides detailed examples of using the Schema Mapper MCP Server for real-world integration scenarios.

## Scenario 1: CRM Integration (Salesforce to HubSpot)

### Step 1: Load Salesforce Schema

```typescript
schema_load_system_a({
  url: "https://api.salesforce.com/openapi/v1.json"
})
```

### Step 2: Load HubSpot Schema

```typescript
schema_load_system_b({
  source: "https://api.hubapi.com/crm/v3/schemas",
  source_type: "url"
})
```

### Step 3: Generate Mapping Suggestions

```typescript
mapping_suggest({
  system_a_endpoint: "/contacts",
  system_a_method: "POST",
  system_b_endpoint: "/crm/v3/objects/contacts",
  system_b_method: "POST",
  confidence_threshold: 0.75
})
```

Expected suggestions:
- `FirstName` → `firstname` (95% confidence)
- `LastName` → `lastname` (95% confidence)
- `Email` → `email` (100% confidence)
- `Phone` → `phone` (90% confidence)
- `Company` → `company` (85% confidence)

### Step 4: Create and Save Mapping

```typescript
mapping_save({
  mapping_id: "salesforce-hubspot-contacts",
  name: "Salesforce to HubSpot Contact Sync",
  description: "Map Salesforce contact fields to HubSpot CRM contacts",
  system_a_endpoint: "/contacts",
  system_a_method: "POST",
  system_b_endpoint: "/crm/v3/objects/contacts",
  system_b_method: "POST",
  field_mappings: JSON.stringify([
    {
      sourceField: "FirstName",
      targetField: "firstname",
      sourceType: "string",
      targetType: "string",
      transformation: { type: "direct" },
      required: true
    },
    {
      sourceField: "LastName",
      targetField: "lastname",
      sourceType: "string",
      targetType: "string",
      transformation: { type: "direct" },
      required: true
    },
    {
      sourceField: "Email",
      targetField: "email",
      sourceType: "string",
      targetType: "string",
      transformation: { type: "direct" },
      required: true
    },
    {
      sourceField: "Phone",
      targetField: "phone",
      sourceType: "string",
      targetType: "string",
      transformation: { type: "direct" },
      required: false
    }
  ])
})
```

### Step 5: Transform Contact Data

```typescript
transform_a_to_b({
  mapping_id: "salesforce-hubspot-contacts",
  payload: JSON.stringify({
    FirstName: "Jane",
    LastName: "Smith",
    Email: "jane.smith@example.com",
    Phone: "+1-555-0123",
    Company: "Acme Corp"
  })
})
```

Result:
```json
{
  "success": true,
  "transformedPayload": {
    "firstname": "Jane",
    "lastname": "Smith",
    "email": "jane.smith@example.com",
    "phone": "+1-555-0123",
    "company": "Acme Corp"
  }
}
```

## Scenario 2: E-commerce Migration (Shopify to WooCommerce)

### Product Data Transformation

```typescript
// 1. Load schemas
schema_load_system_a({
  url: "https://shopify.dev/api/admin-rest/openapi.json"
})

schema_load_system_b({
  source: "https://woocommerce.github.io/woocommerce-rest-api-docs/wp-json-products-v3.html",
  source_type: "url"
})

// 2. Generate mapping
mapping_suggest({
  system_a_endpoint: "/products",
  system_a_method: "POST",
  system_b_endpoint: "/wp-json/wc/v3/products",
  system_b_method: "POST"
})

// 3. Save mapping with complex transformations
mapping_save({
  mapping_id: "shopify-woocommerce-products",
  name: "Shopify to WooCommerce Product Migration",
  system_a_endpoint: "/products",
  system_a_method: "POST",
  system_b_endpoint: "/wp-json/wc/v3/products",
  system_b_method: "POST",
  field_mappings: JSON.stringify([
    {
      sourceField: "title",
      targetField: "name",
      sourceType: "string",
      targetType: "string",
      transformation: { type: "direct" },
      required: true
    },
    {
      sourceField: "body_html",
      targetField: "description",
      sourceType: "string",
      targetType: "string",
      transformation: { type: "direct" },
      required: false
    },
    {
      sourceField: "variants[].price",
      targetField: "regular_price",
      sourceType: "string",
      targetType: "string",
      transformation: { type: "direct" },
      required: true
    },
    {
      sourceField: "variants[].sku",
      targetField: "sku",
      sourceType: "string",
      targetType: "string",
      transformation: { type: "direct" },
      required: false
    },
    {
      sourceField: "tags",
      targetField: "tags",
      sourceType: "array",
      targetType: "array",
      transformation: { type: "direct" },
      required: false
    }
  ])
})

// 4. Transform product
transform_a_to_b({
  mapping_id: "shopify-woocommerce-products",
  payload: JSON.stringify({
    title: "Premium Leather Jacket",
    body_html: "<p>High-quality leather jacket</p>",
    variants: [
      {
        price: "199.99",
        sku: "JACKET-LEATHER-001",
        inventory_quantity: 10
      }
    ],
    tags: ["clothing", "leather", "jackets"]
  })
})
```

## Scenario 3: Payment Gateway Integration

### Stripe to PayPal Transaction Mapping

```typescript
// Create mapping for payment processing
mapping_save({
  mapping_id: "stripe-paypal-payments",
  name: "Stripe to PayPal Payment Data",
  system_a_endpoint: "/charges",
  system_a_method: "POST",
  system_b_endpoint: "/v2/payments",
  system_b_method: "POST",
  field_mappings: JSON.stringify([
    {
      sourceField: "amount",
      targetField: "amount.value",
      sourceType: "integer",
      targetType: "string",
      transformation: {
        type: "format",
        params: { from: "integer", to: "string", divide: 100 }
      },
      required: true
    },
    {
      sourceField: "currency",
      targetField: "amount.currency",
      sourceType: "string",
      targetType: "string",
      transformation: { type: "direct" },
      required: true
    },
    {
      sourceField: "description",
      targetField: "description",
      sourceType: "string",
      targetType: "string",
      transformation: { type: "direct" },
      required: false
    }
  ])
})

// Transform payment data
transform_a_to_b({
  mapping_id: "stripe-paypal-payments",
  payload: JSON.stringify({
    amount: 5000, // cents
    currency: "USD",
    description: "Product purchase"
  })
})

// Result:
// {
//   "amount": {
//     "value": "50.00",
//     "currency": "USD"
//   },
//   "description": "Product purchase"
// }
```

## Scenario 4: Inventory Management System

### Multi-warehouse Synchronization

```typescript
// System A: Main inventory (detailed schema)
// System B: Warehouse system (simplified schema)

mapping_save({
  mapping_id: "inventory-warehouse-sync",
  name: "Main Inventory to Warehouse Sync",
  system_a_endpoint: "/inventory/items",
  system_a_method: "PUT",
  system_b_endpoint: "/warehouse/stock",
  system_b_method: "POST",
  field_mappings: JSON.stringify([
    {
      sourceField: "product.sku",
      targetField: "item_code",
      sourceType: "string",
      targetType: "string",
      transformation: { type: "direct" },
      required: true
    },
    {
      sourceField: "product.name",
      targetField: "item_name",
      sourceType: "string",
      targetType: "string",
      transformation: { type: "direct" },
      required: true
    },
    {
      sourceField: "locations",
      targetField: "warehouse_id",
      sourceType: "array",
      targetType: "string",
      transformation: {
        type: "custom",
        function: "extractPrimaryLocation"
      },
      required: true
    },
    {
      sourceField: "quantity_available",
      targetField: "quantity",
      sourceType: "integer",
      targetType: "integer",
      transformation: { type: "direct" },
      required: true
    }
  ])
})
```

## Scenario 5: Date Format Conversions

### Handling Different Date Formats

```typescript
mapping_save({
  mapping_id: "date-format-conversion",
  name: "Date Format Standardization",
  system_a_endpoint: "/events",
  system_a_method: "POST",
  system_b_endpoint: "/calendar/events",
  system_b_method: "POST",
  field_mappings: JSON.stringify([
    {
      sourceField: "event_date",
      targetField: "start_date",
      sourceType: "string",
      targetType: "string",
      transformation: {
        type: "format",
        params: {
          from: "date",      // YYYY-MM-DD
          to: "date-time"    // ISO 8601
        }
      },
      required: true
    },
    {
      sourceField: "duration_minutes",
      targetField: "duration",
      sourceType: "integer",
      targetType: "string",
      transformation: {
        type: "format",
        params: {
          from: "integer",
          to: "string",
          format: "ISO8601_duration"
        }
      },
      required: true
    }
  ])
})

// Transform
transform_a_to_b({
  mapping_id: "date-format-conversion",
  payload: JSON.stringify({
    event_date: "2025-02-15",
    event_name: "Product Launch",
    duration_minutes: 120
  })
})

// Result:
// {
//   "start_date": "2025-02-15T00:00:00.000Z",
//   "event_name": "Product Launch",
//   "duration": "PT2H"
// }
```

## Scenario 6: Array to String Conversions

### Tags and Categories

```typescript
mapping_save({
  mapping_id: "array-string-conversion",
  name: "Array/String Field Conversion",
  system_a_endpoint: "/articles",
  system_a_method: "POST",
  system_b_endpoint: "/posts",
  system_b_method: "POST",
  field_mappings: JSON.stringify([
    {
      sourceField: "tags",
      targetField: "tag_string",
      sourceType: "array",
      targetType: "string",
      transformation: {
        type: "join",
        params: { separator: ", " }
      },
      required: false
    },
    {
      sourceField: "categories",
      targetField: "category_names",
      sourceType: "array",
      targetType: "string",
      transformation: {
        type: "join",
        params: { separator: ";" }
      },
      required: false
    }
  ])
})

transform_a_to_b({
  mapping_id: "array-string-conversion",
  payload: JSON.stringify({
    title: "My Article",
    tags: ["technology", "programming", "AI"],
    categories: ["Tech News", "Tutorials"]
  })
})

// Result:
// {
//   "title": "My Article",
//   "tag_string": "technology, programming, AI",
//   "category_names": "Tech News;Tutorials"
// }
```

## Testing and Validation

### Generate Test Data

```typescript
// Generate example payload for testing
generate_example_payload({
  mapping_id: "salesforce-hubspot-contacts",
  system: "A"
})

// Result: Sample data matching System A schema
// {
//   "FirstName": "example_FirstName",
//   "LastName": "example_LastName",
//   "Email": "example_Email",
//   "Phone": "example_Phone"
// }
```

### Validate Mapping

```typescript
validate_mapping({
  mapping_id: "salesforce-hubspot-contacts"
})

// Result:
// Status: ✓ Valid
// All field mappings are valid and ready to use.
```

## Advanced Features

### Lookup Tables for Value Mapping

```typescript
mapping_save({
  mapping_id: "status-code-mapping",
  name: "Status Code Translation",
  system_a_endpoint: "/orders",
  system_a_method: "GET",
  system_b_endpoint: "/shipments",
  system_b_method: "POST",
  field_mappings: JSON.stringify([
    {
      sourceField: "status",
      targetField: "shipment_status",
      sourceType: "string",
      targetType: "string",
      transformation: {
        type: "lookup",
        params: {
          table: {
            "pending": "awaiting_shipment",
            "processing": "in_transit",
            "completed": "delivered",
            "cancelled": "cancelled"
          }
        }
      },
      required: true
    }
  ])
})
```

## Best Practices

1. **Start with high confidence**: Use threshold of 0.8+ for initial mappings
2. **Review suggestions**: Always review AI-generated mappings before saving
3. **Test transformations**: Use example payloads to test before production
4. **Handle missing fields**: Plan for optional vs required field mapping
5. **Document mappings**: Use clear names and descriptions
6. **Version control**: Export mappings for version control and backup

## Troubleshooting

### Common Issues

**Issue**: Mapping suggestions have low confidence
**Solution**: Check field naming conventions, consider manual mapping

**Issue**: Transformation fails with type error
**Solution**: Verify source and target types match or add appropriate transformation

**Issue**: Unmapped fields warning
**Solution**: Review source schema, add mappings or mark as intentional

**Issue**: Validation errors after transformation
**Solution**: Check required fields and validation rules in mapping