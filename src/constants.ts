/**
 * Application constants
 */

// Field name synonyms for intelligent mapping
export const FIELD_SYNONYMS: Record<string, string[]> = {
  email: ["mail", "e_mail", "email_address", "emailaddress"],
  phone: ["telephone", "tel", "phone_number", "phonenumber", "mobile", "contact_number", "contactnumber"],
  name: ["fullname", "full_name", "display_name", "displayname"],
  firstName: ["first_name", "firstname", "given_name", "givenname"],
  lastName: ["last_name", "lastname", "family_name", "familyname", "surname"],
  street: ["address", "street_address", "streetaddress", "street1"],
  city: ["location", "town"],
  state: ["province", "region"],
  zipCode: ["zip", "postal_code", "postalcode", "postcode"],
  country: ["nation"],
  birthDate: ["birth_date", "birthdate", "dob", "date_of_birth", "dateofbirth"],
  companyName: ["company", "organization", "org_name", "orgname", "business_name", "businessname"],
  status: ["state", "condition"],
  createdAt: ["created_date", "createddate", "creation_date", "created_on", "created"],
  updatedAt: ["updated_date", "updateddate", "last_modified", "lastmodified", "modified_at", "modifiedat"],
  id: ["identifier", "uid", "unique_id", "uniqueid", "entity_id", "entityid"],
};

// Default confidence threshold for field mapping suggestions
export const DEFAULT_CONFIDENCE_THRESHOLD = 0.7;

// Storage path for saved mappings
export const MAPPING_STORAGE_PATH = "./mappings.json";

// Default values
export const DEFAULT_TIMEOUT_MS = 30000;
export const MAX_PAYLOAD_SIZE_MB = 10;
