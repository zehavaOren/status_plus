
// const BASE_URL = 'http://localhost:4000/file';

// export const downloadFile = async (fileUrl: string, filename: string) => {
//     try {
//         const response = await fetch(fileUrl);
//         const blob = await response.blob();
//         const url = window.URL.createObjectURL(blob);
//         const link = document.createElement('a');
//         link.href = url;
//         link.setAttribute('download', filename);
//         document.body.appendChild(link);
//         link.click();
//         link.remove();
//     } catch (error) {
//         console.error('Error downloading the file', error);
//     }
// };

// export const compressAndUploadFile = async (file: File, studentId: string | undefined) => {
//     try {
//         if (studentId) {
//             const formData = new FormData();
//             formData.append('file', file);
//             formData.append('sqlId', studentId);

//             const response = await fetch(`${BASE_URL}/`, {
//                 method: 'POST',
//                 body: formData,
//             });

//             if (!response.ok) {
//                 throw new Error('Failed to upload file');
//             }

//             const data = await response.json(); // Assuming server returns JSON
//             return data;
//         }
//     } catch (error) {
//         console.error('Error compressing and uploading the file', error);
//         throw error;
//     }
// };
export const handleDownload = (base64File: string, year: string, studentName: string) => {
    const byteCharacters = atob(base64File); // Decode base64
    const byteNumbers = Array.from(byteCharacters, char => char.charCodeAt(0)); // Convert to byte array
    const byteArray = new Uint8Array(byteNumbers); // Create a Uint8Array
    const blob = new Blob([byteArray], { type: 'application/pdf' }); // Create a blob
    downloadFile(blob, `StudentStatus_${studentName}_${year}.pdf`); // Trigger the download
};

// Utility function to download a file in the browser
export const downloadFile = (blob: Blob, filename: string) => {
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url); // Clean up after the download
};