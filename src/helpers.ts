import {
  WorkflowClient,
  WorkflowExecutionDescription,
} from '@temporalio/client'
import { GraphQLResolveInfo } from 'graphql'
import {
  parseResolveInfo,
  ResolveTree,
  simplifyParsedResolveInfoFragmentWithType,
} from 'graphql-parse-resolve-info'
import { omit } from 'lodash'
import { Workflow } from './generated-resolver-types'
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

// type GetWorkflowsInput = {
//   input: WorkflowsInput
//   client: WorkflowClient
// }

// export async function getWorkflows({ input, client }: )
