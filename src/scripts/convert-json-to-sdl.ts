import fs from 'fs'
import { buildClientSchema, printSchema } from 'graphql'
import path from 'path'

const introspectionSchemaResult = JSON.parse(
  fs
    .readFileSync(path.join(__dirname, '../../generated/graphql.schema.json'))
    .toString()
)

const graphqlSchemaObj = buildClientSchema(introspectionSchemaResult)
const sdlString = printSchema(graphqlSchemaObj)

console.log(sdlString)
