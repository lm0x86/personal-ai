import * as z from 'zod'

export const jsonSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  properties: {
    name: {
      type: 'string',
      description:
        'The name of the request in snake_case (must contain only letters and underscores, no spaces or numbers).',
      pattern: '^[a-zA-Z_]+$', // Allows only letters and underscores
    },
    description: {
      type: 'string',
      description: 'A brief description of the request',
    },
    method: {
      type: 'string',
      enum: ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'],
      description: 'The HTTP method used for the request',
    },
    url: {
      type: 'string',
      format: 'uri',
      description: 'The endpoint URL for the request',
    },
    headers: {
      type: 'object',
      additionalProperties: {
        type: 'string',
      },
      description: 'Key-value pairs representing the headers for the request',
    },
    'content-type': {
      // Changed from 'contentType' to 'content-type'
      type: 'string',
      description: 'The Content-Type header for the request',
      default: 'application/json',
      examples: ['application/json', 'application/xml'],
    },
    parameters: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'The name of the parameter',
          },
          type: {
            type: 'string',
            enum: ['string', 'number', 'boolean'],
            description: 'The data type of the parameter',
          },
          required: {
            type: 'boolean',
            description: 'Whether this parameter is required',
          },
          location: {
            type: 'string',
            enum: ['body', 'path', 'query', 'headers'],
            description: 'The location of the parameter in the request',
          },
          description: {
            type: 'string',
            description: 'A description of the parameter',
          },
          values: {
            type: 'object',
            // items: {
            //   type: 'string',
            //   // enum: allowedOperators, // Add enum constraint here
            // },
            description: 'Item values',
          },
        },
        required: ['name', 'type', 'required', 'location', 'description'],
        additionalProperties: false,
      },
      description: 'Array of parameters used in the request',
      additionalItems: false,
    },

    /**
     * The key part here is the `data` property inside each object of the `body` array.
     * We replace the simple { type: 'object' } with a recursive patternProperties
     * definition to allow arbitrary keys and values (including Handlebars).
     */
    body: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          'content-type': {
            type: 'string',
            description: 'The content type of the body',
            default: 'application/json',
            examples: ['application/json', 'application/xml'],
          },
          data: 'string',
        },
        required: ['content-type', 'data'],
        additionalProperties: false,
      },
      additionalItems: false,
      description: 'Body objects with content type and data',
    },
  },

  /**
   * Mark these fields as required at the top-level.
   */
  required: [
    'name',
    'description',
    'method',
    'url',
    'content-type',
    'parameters',
  ],
  additionalProperties: false,

  /**
   * Definitions section for the recursive “data” object.
   * - patternProperties allows any string key (including something like {{price}}).
   * - each value can be either a string or another nested object of the same shape.
   */
  definitions: {
    dataObject: {
      type: 'object',
      description:
        'A recursively-defined object to allow Handlebars in keys/values',
      patternProperties: {
        '^.*$': {
          oneOf: [
            {
              type: 'string',
              // Optionally, you can add a `pattern` here to strictly enforce {{handlebars}} syntax.
              // e.g. "pattern": "^{{[^}]+}}$"
            },
            {
              // Nested objects of the same shape
              $ref: '#/definitions/dataObject',
            },
          ],
        },
      },
      additionalProperties: false,
    },
  },
} as const

// TypeScript type for the JSON schema (optional but recommended)
export type JsonSchemaType = typeof jsonSchema

// Example JSON data conforming to the schema
export const exampleJson = {
  name: '',
  description: '',
  method: 'post',
  url: 'https://',
  headers: {
    Authorization: '',
  },
  'content-type': 'application/json', // Updated key
  parameters: [
    {
      name: 'price',
      type: 'number',
      required: true,
      location: 'body',
      description:
        'Price parameter responsible for setting a price limit in the search.',
    },
    {
      name: 'operator',
      type: 'number',
      required: true,
      location: 'body',
      description:
        'Price parameter responsible for setting a price limit in the search.',
    },
    // Removed operator parameters as per previous instructions
  ],
  body: [
    {
      'content-type': 'application/json', // Updated key
      data: '{}',
    },
  ],
} as const

// TypeScript type for the example JSON (optional)
export type ExampleJsonType = typeof exampleJson

// Form schema for validation with zod
export const formSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'Name is required' })
    .refine((val) => !val.includes(' '), {
      message: 'Name should not contain spaces',
    })
    .refine((val) => /^[a-zA-Z0-9_]+$/.test(val), {
      message: 'Name should only contain letters, numbers, and underscores',
    }),
  description: z.string().optional(),
  method: z.string().min(1, { message: 'Method is required' }),
  url: z.string().url({ message: 'Must be a valid URL' }),
  'content-type': z.string().min(1, { message: 'Content-Type is required' }),
  headerItems: z.array(
    z.object({
      key: z.string().min(1, { message: 'Header key is required' }),
      value: z.string().min(1, { message: 'Header value is required' }),
    }),
  ),
  headers: z.record(z.string()),
  parameters: z.array(
    z.object({
      name: z
        .string()
        .min(1, { message: 'Parameter name is required' })
        .refine((val) => !val.includes(' '), {
          message: 'Parameter name should not contain spaces',
        })
        .refine((val) => /^[a-zA-Z0-9_]+$/.test(val), {
          message:
            'Parameter name should only contain letters, numbers, and underscores',
        }),
      type: z.string().min(1, { message: 'Parameter type is required' }),
      required: z.boolean().default(false),
      location: z
        .string()
        .min(1, { message: 'Parameter location is required' }),
      description: z.string().optional(),
      values: z.record(z.string()).optional(),
    }),
  ),
  body: z
    .array(
      z.object({
        'content-type': z
          .string()
          .min(1, { message: 'Content type is required' }),
        data: z.string().min(1, { message: 'Body data is required' }),
      }),
    )
    .optional(),
})
