# Webpagetest for Pliers

Include the below to your package.json file and `npm install`

```
"pliers-webpagetest": "timjgleeson/pliers-webpagetest"
```

In your `pliers.js` add:

```
pliersWebpagetest = require('pliers-webpagetest')

...

pliersWebpagetest(pliers, taskName:string, url:string, apiKey:string, location:string)
```

Example:
```
pliersWebpagetest(pliers, 'runWebpagetest', 'http://www.clock.co.uk', '1234abcd', 'Dulles:Chrome')
```
