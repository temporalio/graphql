/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  WorkflowClient,
  WorkflowExecutionDescription,
} from '@temporalio/client'
import {
  defaultPayloadConverter,
  mapFromPayloads,
  optionalTsToDate,
  searchAttributePayloadConverter,
  tsToDate,
  tsToMs,
} from '@temporalio/common'
import { WrappedPayloadConverter } from '@temporalio/common/lib/converter/wrapped-payload-converter'
import { GraphQLResolveInfo } from 'graphql'
import {
  parseResolveInfo,
  ResolveTree,
  simplifyParsedResolveInfoFragmentWithType,
} from 'graphql-parse-resolve-info'
import { omit } from 'lodash'
import { Workflow, WorkflowsInput } from './generated-resolver-types'
import { hasOwnProperty, isRecord } from './types'

export function hasMoreThan(object: object, ...fields: string[]): boolean {
  return Object.entries(omit(object, fields)).length > 0
}

type GetWorkflowInput = {
  id: string
  runId?: string | null
  client: WorkflowClient
  info: GraphQLResolveInfo
}

const defaultConverter = new WrappedPayloadConverter(defaultPayloadConverter)
const searchAttributeConverter = new WrappedPayloadConverter(
  searchAttributePayloadConverter
)

export async function getWorkflow({
  id,
  runId,
  client,
  info,
}: GetWorkflowInput): Promise<Workflow> {
  const parsedResolveInfoFragment = parseResolveInfo(info)
  const { fields } = simplifyParsedResolveInfoFragmentWithType(
    parsedResolveInfoFragment as ResolveTree,
    info.returnType
  )
  if (runId && !hasMoreThan(fields, 'id', 'runId')) {
    return { id, runId } as Workflow
  }

  if (!hasMoreThan(fields, 'id')) {
    return { id } as Workflow
  }

  const handle = client.getHandle(id, runId || undefined)

  const promises: [WorkflowExecutionDescription, any] = [
    await handle.describe(),
    resultRequested(fields) ? handle.result() : null,
  ]

  const [description, result] = await Promise.all(promises)

  return {
    id,
    ...description,
    ...(result && { result }),
  } as unknown as Workflow
}

const resultRequested = (fields: unknown) =>
  isRecord(fields) && hasOwnProperty(fields, 'result')

type GetWorkflowsInput = {
  input: WorkflowsInput
  client: WorkflowClient
  info: GraphQLResolveInfo
}

export async function getWorkflows({ input, client }: GetWorkflowsInput) {
  const { executions, nextPageToken } =
    await client.service.listWorkflowExecutions({
      namespace: 'default',
      ...input,
    })

  const nodes = executions.map(
    ({
      execution,
      type,
      startTime,
      closeTime,
      status,
      historyLength,
      parentNamespaceId,
      parentExecution,
      executionTime,
      memo,
      searchAttributes,
      // autoResetPoints,
      taskQueue,
      stateTransitionCount,
    }) =>
      ({
        id: execution!.workflowId,
        runId: execution!.runId,
        type: type!.name,
        status: status!,
        taskQueue: taskQueue!,
        historyLength: historyLength!,
        startTime: optionalTsToDate(startTime),
        executionTime: optionalTsToDate(executionTime),
        closeTime: optionalTsToDate(closeTime),
        parentExecution,
        parentNamespace: parentNamespaceId!,
        // todo raw memo w/ base64
        // memo: mapFromPayloads(defaultConverter, memo?.fields),
        // searchAttributes: mapFromPayloads(
        //   searchAttributeConverter,
        //   searchAttributes?.indexedFields
        // ),
        stateTransitionCount: stateTransitionCount!,
      } as unknown as Workflow) // manually check we have all fields
  )

  return {
    nodes,
    nextPageToken: nextPageToken.length === 0 ? null : nextPageToken,
  }
}
