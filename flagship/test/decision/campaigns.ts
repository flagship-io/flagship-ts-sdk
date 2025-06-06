export const campaigns = {
  visitorId: 'toto',
  campaigns: [
    {
      id: 'c2nrh1hjg50l9thhu8bg',
      slug: 'campaigns_1',
      variationGroupId: 'c2nrh1hjg50l9thhu8cg',
      variation: {
        id: 'c2nrh1hjg50l9thhu8dg',
        modifications: {
          type: 'JSON',
          value: { key: 'value' }
        },
        reference: false
      }
    },
    {
      id: 'c3ev1afkprbg5u3burag',
      slug: 'campaigns_2',
      variationGroupId: 'c3ev1afkprbg5u3burbg',
      variation: {
        id: 'c3ev1afkprbg5u3burcg',
        modifications: {
          type: 'JSON',
          value: {
            array: [1, 1, 1],
            complex: {
              carray: [
                { cobject: 0 }
              ]
            },
            object: { value: 123456 }
          }
        },
        reference: false
      }
    }
  ],
  extras: {
    accountSettings: {
      '@type': 'type.googleapis.com/flagship.protobuf.AccountSettings',
      enabledXPC: false,
      enabled1V1T: false,
      troubleshooting: {
        startDate: '2023-04-13T09:33:38.049Z',
        endDate: '2023-04-13T10:03:38.049Z',
        timezone: 'Europe/Paris',
        traffic: 40
      }
    }
  }
};
