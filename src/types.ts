import type { WorkflowClient } from '@temporalio/client'

export type NonNegativeInteger<T extends number> = number extends T
  ? never
  : `${T}` extends `-${string}` | `${string}.${string}`
  ? never
  : T

export type MyContext = {
  client: WorkflowClient
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function hasOwnProperty<
  X extends Record<string, unknown>,
  Y extends PropertyKey
>(record: X, prop: Y): record is X & Record<Y, unknown> {
  return prop in record
}

export function hasOwnProperties<
  X extends Record<string, unknown>,
  Y extends PropertyKey
>(record: X, props: Y[]): record is X & Record<Y, unknown> {
  return props.every((prop) => prop in record)
}
