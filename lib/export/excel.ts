import ExcelJS from 'exceljs'

export interface TestCaseRow {
  id: string
  title: string
  module: string
  preconditions: string
  steps: string
  expectedResult: string
  priority: string
  status: string
  category: string
}

export async function generateExcel(
  testCases: TestCaseRow[],
  sheetName = 'Test Cases'
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet(sheetName)

  worksheet.columns = [
    { header: 'ID', key: 'id', width: 20 },
    { header: 'Title', key: 'title', width: 40 },
    { header: 'Module', key: 'module', width: 20 },
    { header: 'Preconditions', key: 'preconditions', width: 30 },
    { header: 'Steps', key: 'steps', width: 50 },
    { header: 'Expected Result', key: 'expectedResult', width: 40 },
    { header: 'Priority', key: 'priority', width: 10 },
    { header: 'Category', key: 'category', width: 15 },
    { header: 'Status', key: 'status', width: 12 },
  ]

  const headerRow = worksheet.getRow(1)
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E293B' },
  }
  headerRow.alignment = { vertical: 'middle' }

  testCases.forEach((tc) => {
    const row = worksheet.addRow(tc)
    row.alignment = { wrapText: true, vertical: 'top' }

    const priorityCell = row.getCell('priority')
    if (tc.priority === 'P0') {
      priorityCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFECACA' } }
    } else if (tc.priority === 'P1') {
      priorityCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFED7AA' } }
    }
  })

  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: worksheet.columns.length },
  }

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}
