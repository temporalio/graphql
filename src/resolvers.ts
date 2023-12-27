import { resolvers as scalarResolvers } from 'graphql-scalars'
import { v4 as uuid } from 'uuid'
import { Base64 } from './base64'
import { Resolvers, WorkflowStatus } from './generated-resolver-types'
import { getWorkflow, getWorkflows } from './helpers'
import { hasOwnProperties, hasOwnProperty, isRecord } from './types'
import { QueryDefinition, SignalDefinition } from '@temporalio/client'

export const resolvers: Resolvers = {
  ...scalarResolvers,
  Base64,
  WorkflowStatus: {
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
    isRunning: ({ status }) => status === WorkflowStatus.Running,
    parent: (workflow, _, { client }, info) =>
      hasOwnProperty(workflow, 'parentExecution') &&
      isRecord(workflow.parentExecution) &&
      hasOwnProperties(workflow.parentExecution, ['workflowId', 'runId'])
        ? getWorkflow({
            id: workflow.parentExecution.workflowId as string,
            runId: (workflow.parentExecution.runId as string) ?? null,
            client,
            info,
          })
        : null,
    result: (workflow, _, { client }) =>
      client
        .getHandle(
          workflow.id || (workflow as any).workflowId,
          workflow.runId || undefined
        )
        .result(),
  },
  Query: {
    workflow: async (_, { id, runId }, { client }, info) =>
      getWorkflow({ id, runId, client, info }),
    workflows: async (_, { input }, { client }, info) =>
      getWorkflows({ input, client, info }),
    query: async (_, { input: { id, name, args, runId } }, { client }) => {
      const handle = client.getHandle(id, runId ?? undefined)
      return await handle.query(
        { type: 'query', name } as QueryDefinition<unknown, any>,
        ...(args || [])
      )
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
      const handle = client.getHandle(id, runId ?? undefined)
      await handle.signal({ type: 'signal', name } as SignalDefinition, ...args)
      return await getWorkflow({ id, runId, client, info })
    },
    cancel: async (_, { input: { id, runId } }, { client }, info) => {
      const handle = client.getHandle(id, runId ?? undefined)
      await handle.cancel()
      return await getWorkflow({ id, runId, client, info })
    },
    terminate: async (
      _,
      { input: { id, runId, reason } },
      { client },
      info
    ) => {
      const handle = client.getHandle(id, runId ?? undefined)
      await handle.terminate(reason ?? undefined)
      return await getWorkflow({ id, runId, client, info })
    },
    signalWithStart: async (
      _,
      { input: { id, workflowType, signalArgs = [], ...rest } },
      { client },
      info
    ) => {
      await client.signalWithStart(workflowType, {
        ...rest,
        signalArgs,
        workflowId: id,
      })
      return await getWorkflow({ id, client, info })
    },
  },
}
