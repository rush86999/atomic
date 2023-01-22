# Script

The file is located under `script` folder

### Location

SAMPLE-unsynchronise.js
`
script/unsynchronise.js
`

### Instructions

1. In your `package.json` file paste `"unsync": "node ./script/unsynchronise.js",` value under 
`  
"scripts": {
    
}
`

2. Copy [SAMPLE-unsynchronise.js](#location) over to above mentioned [location](#location)


### To install Amplify in mobile app

1. To install amplify use following command in terminal

`
amplify codegen models && amplify push --yes && npm run unsync && amplify codegen
`

* Please note: update 10 models at a time as aws cli does not handle > 10 models in 1 push. In other words, paste 10 models in schema.graphql and use amplify push until all models are accounted for

Optional:

2. In your `package.json` file paste 
`"pull:api": "amplify codegen models && amplify pull && npm run unsync && amplify codegen",
    "push:api": "amplify codegen models && amplify push --yes && npm run unsync && amplify codegen",`
value under 

`"scripts": {
    
}`




