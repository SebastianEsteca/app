import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export async function exportElementToImage(element, filename = 'torneo.png') {
  if (!element) return;
  const canvas = await html2canvas(element, {
    backgroundColor: '#050A05',
    scale: 2,
    useCORS: true,
  });
  const url = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function exportElementToPDF(element, filename = 'torneo.pdf') {
  if (!element) return;
  const canvas = await html2canvas(element, {
    backgroundColor: '#050A05',
    scale: 2,
    useCORS: true,
  });
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'pt', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth - 40;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  if (imgHeight <= pageHeight - 40) {
    pdf.addImage(imgData, 'PNG', 20, 20, imgWidth, imgHeight);
  } else {
    // Multi-page: split canvas vertically
    let position = 0;
    const ratio = imgWidth / canvas.width;
    const sliceHeightPx = (pageHeight - 40) / ratio;
    while (position < canvas.height) {
      const sliceCanvas = document.createElement('canvas');
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = Math.min(sliceHeightPx, canvas.height - position);
      const ctx2 = sliceCanvas.getContext('2d');
      ctx2.fillStyle = '#050A05';
      ctx2.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
      ctx2.drawImage(
        canvas,
        0, position, canvas.width, sliceCanvas.height,
        0, 0, canvas.width, sliceCanvas.height
      );
      const sliceData = sliceCanvas.toDataURL('image/png');
      if (position > 0) pdf.addPage();
      pdf.addImage(sliceData, 'PNG', 20, 20, imgWidth, sliceCanvas.height * ratio);
      position += sliceHeightPx;
    }
  }
  pdf.save(filename);
}
