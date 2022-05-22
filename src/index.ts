import { WorkflowClient } from '@temporalio/client'
import { ApolloServer } from 'apollo-server'
import { ApolloServerPluginLandingPageGraphQLPlayground } from 'apollo-server-core'
import { readFileSync } from 'fs'
import { typeDefs as scalarTypeDefs } from 'graphql-scalars'
import { resolvers } from './resolvers'

const typeDefs = [
  ...scalarTypeDefs,
  readFileSync(require.resolve('./schema.graphql')).toString('utf-8'),
]

async function runServer() {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginLandingPageGraphQLPlayground()],
    context: { client: new WorkflowClient() },
  })

  return server.listen().then(({ url }) => {
    console.log(`🚀  Server ready at ${url}`)
  })
}

runServer().catch((err) => {
  console.log(err)
  process.exit(1)
})
