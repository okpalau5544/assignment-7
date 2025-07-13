import fs from 'fs'

const specs = [
  './services/warehouse/build/swagger.json',
  './services/orders/build/swagger.json'
]

const combinedSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Unified API',
    version: '1.0.0'
  },
  paths: {},
  components: {
    schemas: {},
    responses: {},
    parameters: {},
    requestBodies: {}
  }
}

specs.forEach(file => {
  const spec = JSON.parse(fs.readFileSync(file, 'utf-8'))

  // Merge paths
  Object.assign(combinedSpec.paths, spec.paths)

  // Merge components
  if (
    spec.components !== undefined &&
    spec.components !== null &&
    typeof spec.components === 'object'
  ) {
    const componentKeys = [
      'schemas',
      'responses',
      'parameters',
      'requestBodies'
    ]
    for (const key of componentKeys) {
      if (typeof spec.components[key] !== 'undefined') {
        combinedSpec.components[key] = {
          ...combinedSpec.components[key],
          ...spec.components[key]
        }
      }
    }
  }
})

// Write to final file
fs.writeFileSync('./merged-swagger.json', JSON.stringify(combinedSpec, null, 2))
console.log('Combined Swagger spec generated as merged-swagger.json')
