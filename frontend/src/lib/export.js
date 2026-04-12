function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
}

function toSafeString(value) {
    if (value === null || value === undefined) return ''
    return String(value)
}

function escapeCsvCell(value) {
    const str = toSafeString(value)
    // Escape double quotes by doubling them
    const escaped = str.replace(/"/g, '""')
    // Wrap in quotes if needed
    if (/[\n\r,]/.test(escaped)) return `"${escaped}"`
    return escaped
}

export function exportToCsv({ filename, columns, rows }) {
    const header = columns.map((c) => escapeCsvCell(c.header)).join(',')
    const body = rows
        .map((row) => columns.map((c) => escapeCsvCell(row[c.key])).join(','))
        .join('\n')

    const csv = `${header}\n${body}\n`
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    downloadBlob(blob, filename)
}

export async function exportToPdf({ filename, title, columns, rows }) {
    const { jsPDF } = await import('jspdf')
    const autoTableModule = await import('jspdf-autotable')
    const autoTable = autoTableModule.default

    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
    if (title) {
        doc.setFontSize(14)
        doc.text(title, 40, 40)
    }

    autoTable(doc, {
        startY: title ? 60 : 40,
        head: [columns.map((c) => c.header)],
        body: rows.map((row) => columns.map((c) => toSafeString(row[c.key]))),
        styles: { fontSize: 9, cellPadding: 6 },
        headStyles: { fillColor: [45, 31, 77], textColor: 255 },
        alternateRowStyles: { fillColor: [20, 16, 30] },
    })

    doc.save(filename)
}

export async function exportToDocx({ filename, title, columns, rows }) {
    const docx = await import('docx')
    const {
        Document,
        Packer,
        Paragraph,
        TextRun,
        Table,
        TableRow,
        TableCell,
        WidthType,
    } = docx

    const tableRows = [
        new TableRow({
            children: columns.map(
                (c) =>
                    new TableCell({
                        children: [
                            new Paragraph({
                                children: [new TextRun({ text: c.header, bold: true })],
                            }),
                        ],
                    }),
            ),
        }),
        ...rows.map(
            (row) =>
                new TableRow({
                    children: columns.map(
                        (c) =>
                            new TableCell({
                                children: [new Paragraph(toSafeString(row[c.key]))],
                            }),
                    ),
                }),
        ),
    ]

    const document = new Document({
        sections: [
            {
                children: [
                    ...(title
                        ? [
                              new Paragraph({
                                  children: [new TextRun({ text: title, bold: true, size: 28 })],
                              }),
                              new Paragraph(''),
                          ]
                        : []),
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: tableRows,
                    }),
                ],
            },
        ],
    })

    const blob = await Packer.toBlob(document)
    downloadBlob(blob, filename)
}

export function clampRowCount(value, max) {
    const num = Number(value)
    if (!Number.isFinite(num) || num <= 0) return max
    return Math.min(Math.floor(num), max)
}
