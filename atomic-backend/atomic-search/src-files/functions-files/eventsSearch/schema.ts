export default {
  type: "object",
  properties: {
    method: {
      type: 'string'
    },
    eventId: {
      type: 'string'
    },
    search: {
      type: 'string'
    },
    userId: {
      type: 'string'
    },
    eventDetails: {
      type: 'string'
    },
  },
  required: ['method']
} as const;
