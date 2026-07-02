import arcjet, { shield, detectBot, slidingWindow } from '@arcjet/node';


const aj = arcjet({
  key: process.env.ARCJET_KEY,
  rules: [
    shield({ mode: 'LIVE' }),
    detectBot({
      mode: 'LIVE', 
      allow: [
        'CATEGORY:SEARCH_ENGINE', 
        'CATEGORY:PREVIEW',
      ],
    }),
    slidingWindow({
      mode: 'LIVE',
      interval: 60, // 60 seconds
      max: 10, // Max 10 requests per interval
    })
  ],
});

export default aj;
