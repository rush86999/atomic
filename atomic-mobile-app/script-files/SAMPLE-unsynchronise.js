const fs = require('fs');

const shouldUnsynchronize = (model) => {
  return model.attributes.some(
    (attr) => attr.properties.subscriptions === null,
  );
};

const schemaRaw = fs.readFileSync(
  __dirname + '/../src/models/schema.js',
  'utf-8',
);

const schemaStr = schemaRaw.toString().split('=')[1];

const schema = JSON.parse(schemaStr.split(';')[0]);
const schemaCpy = {...schema};
const modelsKey = Object.keys(schema.models);
for (let key of modelsKey) {
  if (shouldUnsynchronize(schema.models[key])) {
    schemaCpy.models[key]['syncable'] = false;
  }
}

fs.writeFileSync(__dirname + '/../src/models/schema.js', `export const schema=${JSON.stringify(schemaCpy)};`, 'utf8');
