export default {
  type: "object",
  properties: {
    refreshToken: { type: 'string' }
  },
  required: ['refreshToken']
} as const;
