import { handlerPath } from '@libs/handler-resolver';

export const createRecurMeetAssistsPublic = {
  handler: `${handlerPath(__dirname)}/handler.main`,
  timeout: 30,
  events: [
    {
      http: {
        method: 'post',
        path: 'create-recur-meet-assists-public',
        cors: true,
      }
    }
  ],
};

// export const createRecurMeetAssistsAdmin = {
//   handler: `${handlerPath(__dirname)}/handler.main`,
//   events: [
//     {
//       http: {
//         method: 'post',
//         path: 'create-recur-meet-assists-admin',
//         request: {
//           schemas: {
//             'application/json': schema
//           }
//         },
//         cors: true,
//         authorizer: {
//           name: 'authorizerFunc',
//         }
//       }
//     }
//   ],
// };
