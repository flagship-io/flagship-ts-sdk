export const bucketing = {
  campaigns: [
    {
      id: 'c1ndsu87m030114t8uu0',
      type: 'toggle',
      slug: 'campaign_1',
      variationGroups: [
        {
          id: 'c1ndsu87m030114t8uv0',
          targeting: {
            targetingGroups: [
              {
                targetings: [
                  {
                    operator: 'CONTAINS',
                    key: 'fs_users',
                    value: ['_0', '_2', '_4', '_6', '_8']
                  }
                ]
              },
              {
                targetings: [
                  {
                    operator: 'EQUALS',
                    key: 'fs_users',
                    value: 'visitor_1'
                  }
                ]
              }
            ]
          },
          variations: [
            {
              id: 'c1ndsu87m030114t8uvg',
              modifications: {
                type: 'FLAG',
                value: {
                  background: 'bleu ciel',
                  btnColor: '#EE3300',
                  keyBoolean: false,
                  keyNumber: 5660
                }
              },
              allocation: 100
            }
          ]
        },
        {
          id: 'c1ndta129mp0114nbtn0',
          targeting: {
            targetingGroups: [
              {
                targetings: [
                  {
                    operator: 'CONTAINS',
                    key: 'fs_users',
                    value: ['_1', '_3', '_5', '_7', '_9']
                  }
                ]
              }
            ]
          },
          variations: [
            {
              id: 'c1ndta129mp0114nbtng',
              modifications: {
                type: 'FLAG',
                value: {
                  background: 'rouge bordeau',
                  btnColor: 'red',
                  keyBoolean: false,
                  keyNumber: 558
                }
              },
              allocation: 100
            }
          ]
        }
      ]
    },
    {
      id: 'c20j8bk3fk9hdphqtd1g',
      type: 'ab',
      slug: 'campaign_1',
      variationGroups: [
        {
          id: 'c20j8bk3fk9hdphqtd2g',
          targeting: {
            targetingGroups: [
              {
                targetings: [
                  {
                    operator: 'EQUALS',
                    key: 'fs_all_users',
                    value: ''
                  }
                ]
              }
            ]
          },
          variations: [
            {
              id: 'c20j8bk3fk9hdphqtd30',
              modifications: {
                type: 'HTML',
                value: { my_html: '\u003cdiv\u003e\n  \u003cp\u003eOriginal\u003c/p\u003e\n\u003c/div\u003e' }
              },
              allocation: 34,
              reference: true
            },
            {
              id: 'c20j8bk3fk9hdphqtd3g',
              modifications: {
                type: 'HTML',
                value: { my_html: '\u003cdiv\u003e\n  \u003cp\u003evariation 1\u003c/p\u003e\n\u003c/div\u003e' }
              },
              allocation: 33
            },
            {
              id: 'c20j9lgbcahhf2mvhbf0',
              modifications: {
                type: 'HTML',
                value: { my_html: '\u003cdiv\u003e\n  \u003cp\u003evariation 2\u003c/p\u003e\n\u003c/div\u003e' }
              },
              allocation: 33
            }
          ]
        }
      ]
    },
    {
      id: 'c2nreb1jg50l9nkl3hn0',
      type: 'deployment',
      slug: 'campaign_1',
      variationGroups: [
        {
          id: 'c2nreb1jg50l9nkl3ho0',
          targeting: {
            targetingGroups: [
              {
                targetings: [
                  {
                    operator: 'EQUALS',
                    key: 'age',
                    value: 20
                  }
                ]
              }
            ]
          },
          variations: [
            {
              id: 'c2nreb1jg50l9nkl3hog',
              modifications: {
                type: 'FLAG',
                value: {
                  'Feature 1': '1.0.0',
                  'Feature 2': null,
                  featureLogin: null
                }
              }
            },
            {
              id: 'c2nreb1jg50l9nkl3hp0',
              modifications: {
                type: 'FLAG',
                value: {
                  'Feature 1': null,
                  'Feature 2': 10,
                  featureLogin: true
                }
              }
            }
          ]
        }
      ]
    },
    {
      id: 'c2nrh1hjg50l9thhu8bg',
      type: 'perso',
      slug: 'campaign_1',
      variationGroups: [
        {
          id: 'c2nrh1hjg50l9thhu8cg',
          targeting: {
            targetingGroups: [
              {
                targetings: [
                  {
                    operator: 'EQUALS',
                    key: 'fs_all_users',
                    value: ''
                  }
                ]
              }
            ]
          },
          variations: [
            {
              id: 'c2nrh1hjg50l9thhu8d0',
              modifications: {
                type: 'JSON',
                value: { key: null }
              },
              allocation: 30,
              reference: true
            },
            {
              id: 'c2nrh1hjg50l9thhu8dg',
              modifications: {
                type: 'JSON',
                value: { key: 'value' }
              },
              allocation: 70
            }
          ]
        },
        {
          id: 'c2nrhnpjg50la1ht9thg',
          targeting: {
            targetingGroups: [
              {
                targetings: [
                  {
                    operator: 'EQUALS',
                    key: 'fs_users',
                    value: 'visitor_1'
                  }
                ]
              }
            ]
          },
          variations: [
            {
              id: 'c2nrhnpjg50la1ht9ti0',
              modifications: {
                type: 'JSON',
                value: { key2: null }
              },
              allocation: 5,
              reference: true
            },
            {
              id: 'c2nrhnpjg50la1ht9tig',
              modifications: {
                type: 'JSON',
                value: { key2: 'value2' }
              },
              allocation: 95
            }
          ]
        }
      ]
    },
    {
      id: 'c2nrh1fgjg50l9thhu8bg',
      type: 'perso',
      slug: 'campaign_2',
      variationGroups: [
        {
          id: 'c2nrhnpjg50lsf1ht9thg',
          targeting: {
            targetingGroups: [
              {
                targetings: [
                  {
                    operator: 'EQUALS',
                    key: 'mixpanel::key',
                    value: 'value'
                  },
                  {
                    operator: 'EQUALS',
                    key: 'segment.com::key2',
                    value: 'value2'
                  }
                ]
              }
            ]
          },
          variations: [
            {
              id: 'c2nrhnpjg50la1ht9trd0',
              modifications: {
                type: 'JSON',
                value: { thirdIntegration: 'value1' }
              },
              allocation: 5,
              reference: true
            },
            {
              id: 'c2nrhnpjg50la1ht9tgig',
              modifications: {
                type: 'JSON',
                value: { thirdIntegration: 'value2' }
              },
              allocation: 95
            }
          ]
        }
      ]
    }
  ],
  accountSettings: {
    troubleshooting: {
      startDate: '2023-04-13T09:33:38.049Z',
      endDate: '2023-04-13T10:03:38.049Z',
      timezone: 'Europe/Paris',
      traffic: 40
    },
    eaiCollectEnabled: true,
    eaiActivationEnabled: true
  }
};
