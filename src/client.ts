import { WorkflowClient } from '@temporalio/client'
import { example } from './workflows'

async function run() {
  const client = new WorkflowClient()

  const handle = await client.start(example, {
    args: ['Temporal'], // type inference works! args: [name: string]
    taskQueue: 'hello-world',
    // in practice, use a meaningful business id, eg customerId or transactionId
    workflowId: 'wf-id-' + Math.floor(Math.random() * 1000),
  })
  console.log(`Started workflow ${handle.workflowId}`)

  // optional: wait for client result
  console.log(await handle.result()) // Hello, Temporal!
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
