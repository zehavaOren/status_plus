
const BASE_URL = 'http://localhost:4000/file';

export const downloadFile = async (fileUrl: string, filename: string) => {
    try {
        const response = await fetch(fileUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
    } catch (error) {
        console.error('Error downloading the file', error);
    }
};

export const compressAndUploadFile = async (file: File, studentId: string | undefined) => {
    try {
        if (studentId) {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('sqlId', studentId);

            const response = await fetch(`${BASE_URL}/`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Failed to upload file');
            }

            const data = await response.json(); // Assuming server returns JSON
            return data;
        }
    } catch (error) {
        console.error('Error compressing and uploading the file', error);
        throw error;
    }
};