import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { font } from '../Tahoma-Regular-font-normal';

const BASE_URL = 'http://localhost:4000/file';

export const fileService = {

    // adjust pdf text to hebrew
    reverseHebrewText: async (text: string) => {
        return text
            .split(/(\(.*?\)|[\u0590-\u05FF,★-]+|\d+|\S+)/g)
            .map(segment => {
                if (segment.startsWith('(') && segment.endsWith(')')) {
                    const innerText = segment.slice(1, -1);
                    const reversedInner = innerText
                        .split(/(\s+|,|-)/g)
                        .map(word => /^[\u0590-\u05FF]+$/.test(word) ? word.split('').reverse().join('') : word)
                        .reverse()
                        .join('');

                    return `(${reversedInner})`;
                } else if (/^\d+$/.test(segment)) {
                    return `\u2067${segment}\u2066`;
                } else if (/^[\u0590-\u05FF,-]+$/.test(segment)) {
                    return segment
                        .split(/(-)/g)
                        .map(word => word === '-' ? word : word.split('').reverse().join(''))
                        .join('');
                }
                return segment;
            })
            .reverse()
            .join('');
    },

    generatePDF: async (studentDet: any, employeeDetails: any, categoryDataList: any) => {
        try {
            const doc = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });

            doc.addFileToVFS("Tahoma Regular font-normal.ttf", font);
            doc.addFont("Tahoma Regular font-normal.ttf", "Tahoma Regular", "normal");
            doc.setFont("Tahoma Regular", "normal");

            const titleText = await fileService.reverseHebrewText(`סטטוס התלמיד ${studentDet?.studentName}`);
            const yearText = `${studentDet?.year.split('').reverse().join('')} ${await fileService.reverseHebrewText('שנת הלימודים:')}`;

            doc.setFontSize(18);
            doc.text(titleText, 300, 40, { align: 'center' });

            doc.setFontSize(12);
            doc.text(yearText, 300, 60, { align: 'center' });

            let yOffset = 100;

            if (employeeDetails.length > 0) {
                doc.setFontSize(14);
                const staffTitle = await fileService.reverseHebrewText("אנשי צוות ממלאים");
                doc.text(staffTitle, 300, yOffset, { align: 'center' });
                yOffset += 20;

                const staffText = (
                    await Promise.all(
                        employeeDetails.map(async (emp: { employeeName: string; jobDesc: string }) => {
                            const name = await fileService.reverseHebrewText(emp.employeeName);
                            const job = await fileService.reverseHebrewText(emp.jobDesc);
                            return `${name} - ${job}`;
                        })
                    )
                ).join(" | ");

                doc.setFontSize(10);
                doc.text(staffText, 300, yOffset, { align: 'center' });
                yOffset += 30;
            }

            const formatCellText = async (text: string) => {
                const reversed = await fileService.reverseHebrewText(text || 'אין נתונים');
                const wrapped = doc.splitTextToSize(reversed, 200);
                return wrapped.reverse().join('\n');
            };

            const formatCategoryText = async (text: string) => {
                const reversed = await fileService.reverseHebrewText(text || 'אין נתונים');
                const wrapped = doc.splitTextToSize(reversed, 80);
                return wrapped.reverse().join('\n');
            };

            const tableData = await Promise.all(
                categoryDataList.map(async (category: { weaknesses: any[]; strengths: any[]; category: string }) => {
                    const weaknessesText = category.weaknesses.length
                        ? category.weaknesses.map(w => w.valueDesc).join(', ')
                        : 'אין נתונים';
                    const strengthsText = category.strengths.length
                        ? category.strengths.map(s => s.valueDesc).join(', ')
                        : 'אין נתונים';

                    return [
                        await formatCellText(weaknessesText),
                        await formatCellText(strengthsText),
                        await formatCategoryText(category.category),
                    ];
                })
            );

            autoTable(doc, {
                startY: yOffset + 20,
                head: [[
                    await fileService.reverseHebrewText('חולשות'),
                    await fileService.reverseHebrewText('חוזקות'),
                    await fileService.reverseHebrewText('קטגוריה')
                ]],
                body: tableData,
                theme: "grid",
                styles: { font: "Tahoma Regular", fontSize: 10, halign: "center", textColor: [0, 0, 0] },
                headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0] },
                columnStyles: { 0: { cellWidth: 200 }, 1: { cellWidth: 200 }, 2: { cellWidth: 100 } }
            });

            doc.save(`סטטוס ${studentDet?.studentName} ${studentDet?.year}.pdf`);

            // Create blob and convert to base64
            const blob = doc.output('blob');
            return await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });

        } catch (error) {
            console.log("PDF generation error:", error);
            throw error;
        }
    },

    generatePDFBlob: async (studentDet: any, employeeDetails: any, categoryDataList: any): Promise<string> => {
        const base64Pdf = await fileService.generatePDF(studentDet, employeeDetails, categoryDataList);

        if (!base64Pdf) {
            throw new Error("Failed to generate PDF: base64Pdf is undefined.");
        }
        const cleanedBase64 = base64Pdf.split(',')[1];

        const response = await fetch(`${BASE_URL}/uploadPdf`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                studentId: studentDet.studentId,
                year: studentDet.year,
                base64Pdf: cleanedBase64,
            }),
        });
        if (!response.ok) {
            throw new Error('Error fetching employees');
        }
        return await response.json();
    }

}