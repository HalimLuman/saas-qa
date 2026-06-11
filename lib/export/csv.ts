import { format } from 'fast-csv'
import { Writable } from 'node:stream'

export interface TestCaseRow {
  id: string
  title: string
  module: string
  preconditions: string
  steps: string
  expectedResult: string
  priority: string
  category: string
  status: string
}

export async function generateCsv(testCases: TestCaseRow[]): Promise<Buffer> {
  const chunks: Buffer[] = []

  return new Promise((resolve, reject) => {
    const writable = new Writable({
      write(chunk, _enc, cb) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
        cb()
      },
    })

    const csvStream = format({ headers: true, writeBOM: true })
    csvStream.pipe(writable)

    csvStream.on('error', reject)
    writable.on('finish', () => resolve(Buffer.concat(chunks)))
    writable.on('error', reject)

    for (const row of testCases) {
      csvStream.write({
        ID: row.id,
        Title: row.title,
        Module: row.module,
        Preconditions: row.preconditions,
        Steps: row.steps,
        'Expected Result': row.expectedResult,
        Priority: row.priority,
        Category: row.category,
        Status: row.status,
      })
    }

    csvStream.end()
  })
}
