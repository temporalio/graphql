import { WorkflowClient } from '@temporalio/client'
import { ApolloServer } from 'apollo-server'
import { ApolloServerPluginLandingPageGraphQLPlayground } from 'apollo-server-core'
import { readFileSync } from 'fs'
import {
  resolvers as scalarResolvers,
  typeDefs as scalarTypeDefs,
} from 'graphql-scalars'
import { v4 as uuid } from 'uuid'
import { Resolvers } from './generated-resolver-types'
import { getWorkflow } from './helpers'

const typeDefs = [
  ...scalarTypeDefs,
  readFileSync(require.resolve('./schema.graphql')).toString('utf-8'),
]

const resolvers: Resolvers = {
  ...scalarResolvers,
  ExecutionStatus: {
    UNSPECIFIED: 0,
    RUNNING: 1,
    COMPLETED: 2,
    FAILED: 3,
    CANCELED: 4,
    TERMINATED: 5,
    CONTINUED_AS_NEW: 6,
    TIMED_OUT: 7,
  },
  Workflow: {
    id: (workflow: any) => workflow.id || workflow.workflowId,
    parentExecution: (workflow, _, { client }, info) =>
      workflow.parentExecution
        ? getWorkflow({ ...workflow.parentExecution, client, info })
        : null,
  },
  Query: {
    workflow: async (_, { id, runId }, { client }, info) =>
      getWorkflow({ id, runId, client, info }),
    query: async (_, { input: { id, name, args, runId } }, { client }) => {
      const handle = client.getHandle(id, runId)
      return await handle.query({ type: 'query', name }, ...(args || []))
    },
  },
  Mutation: {
    start: async (
      _,
      { input: { type, id, taskQueue, args } },
      { client },
      info
    ) => {
      const workflowId = id ?? uuid()
      await client.start(type, {
        workflowId,
        taskQueue,
        ...(args && { args }),
      })
      return await getWorkflow({ id: workflowId, client, info })
    },
    signal: async (
      _,
      { input: { id, runId, name, args } },
      { client },
      info
    ) => {
      const handle = client.getHandle(id, runId)
      await handle.signal({ type: 'signal', name }, ...args)
      return await getWorkflow({ id, runId, client, info })
    },
    cancel: async (_, { input: { id, runId } }, { client }, info) => {
      const handle = client.getHandle(id, runId)
      await handle.cancel()
      return await getWorkflow({ id, runId, client, info })
    },
    terminate: async (
      _,
      { input: { id, runId, reason } },
      { client },
      info
    ) => {
      const handle = client.getHandle(id, runId)
      await handle.terminate(reason)
      return await getWorkflow({ id, runId, client, info })
    },
    signalWithStart: async (
      _,
      { input: { id, workflowType, ...rest } },
      { client },
      info
    ) => {
      await client.signalWithStart(workflowType, {
        ...rest,
        workflowId: id,
      })
      return await getWorkflow({ id, client, info })
    },
  },
}

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
