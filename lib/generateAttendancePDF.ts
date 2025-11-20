'use client';

export async function generateAttendancePDF(records: any[], branches: any[]) {
  const pdfMake = (await import('pdfmake/build/pdfmake')).default;
  const pdfFonts = (await import('pdfmake/build/vfs_fonts')).default;
  pdfMake.vfs = pdfFonts.vfs;

  // Group records by branch
  const grouped: { [branchId: string]: any[] } = {};
  records.forEach((r) => {
    if (!grouped[r.branch_id]) grouped[r.branch_id] = [];
    grouped[r.branch_id].push(r);
  });

  const content: any[] = [
    { text: 'AAA School – Weekend Attendance Report', style: 'header' },
    { text: `Date: ${new Date().toLocaleDateString('en-GB')}`, style: 'subheader' }
  ];

  for (const [branchId, branchRecords] of Object.entries(grouped)) {
    const branchName = branches.find((b) => b.id === branchId)?.name ?? 'Unknown Branch';
    content.push({ text: `Branch: ${branchName}`, style: 'branchHeader', margin: [0, 10, 0, 5] });

    content.push({
      table: {
        headerRows: 1,
        widths: ['*', '*', '*', '*', '*'],
        body: [
          ['#', 'Student', 'Classroom', 'Date', 'Status'],
          ...branchRecords.map((r, i) => [
            i + 1,
            r.student_name ?? 'N/A',
            r.classroom_name ?? 'N/A',
            r.attendance_date,
            r.status
          ])
        ]
      }
    });
  }

  const docDefinition = {
    content,
    styles: {
      header: { fontSize: 18, bold: true },
      subheader: { fontSize: 14 },
      branchHeader: { fontSize: 16, bold: true, color: '#2E86C1' }
    },
    pageSize: 'A4',
    pageMargins: [40, 60, 40, 60]
  };

  const pdfDocGenerator = pdfMake.createPdf(docDefinition);
  pdfDocGenerator.download(`attendance_report_${new Date().toISOString().split('T')[0]}.pdf`);
}
