import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface PassForPDF {
  passId: string;
  qrDataUrl: string;
  eventId?: string;
  status?: string;
}

/**
 * Generate a PDF with passes laid out 4 per A4 page
 * @param passes - Array of passes to include in the PDF
 * @returns Promise resolving to PDF Blob
 */
export async function generatePassPDF(passes: PassForPDF[]): Promise<Blob> {
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();
  
  // A4 dimensions in points (1 point = 1/72 inch)
  const A4_WIDTH = 595;
  const A4_HEIGHT = 842;
  
  // Pass card dimensions (2x2 grid on A4)
  const PASS_WIDTH = A4_WIDTH / 2;
  const PASS_HEIGHT = A4_HEIGHT / 2;
  
  // Padding and margins
  const PADDING = 20;
  const QR_SIZE = 120;
  
  // Embed fonts
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  // Calculate number of pages needed
  const passesPerPage = 4;
  const totalPages = Math.ceil(passes.length / passesPerPage);
  
  // Process passes in batches of 4
  for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
    const page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
    
    const startIndex = pageIndex * passesPerPage;
    const endIndex = Math.min(startIndex + passesPerPage, passes.length);
    const pagePasses = passes.slice(startIndex, endIndex);
    
    // Layout passes in 2x2 grid
    for (let i = 0; i < pagePasses.length; i++) {
      const pass = pagePasses[i];
      
      // Calculate position (0=top-left, 1=top-right, 2=bottom-left, 3=bottom-right)
      const col = i % 2;
      const row = Math.floor(i / 2);
      
      const x = col * PASS_WIDTH;
      const y = A4_HEIGHT - (row + 1) * PASS_HEIGHT; // PDF coordinates start from bottom
      
      await drawPassCard(page, pass, x, y, PASS_WIDTH, PASS_HEIGHT, PADDING, QR_SIZE, font, fontBold, pdfDoc);
    }
  }
  
  // Serialize the PDF to bytes
  const pdfBytes = await pdfDoc.save();
  
  // Convert to Blob
  return new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
}

/**
 * Draw a single pass card on the PDF page
 */
async function drawPassCard(
  page: any,
  pass: PassForPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  padding: number,
  qrSize: number,
  font: any,
  fontBold: any,
  pdfDoc: PDFDocument
) {
  // Draw border
  page.drawRectangle({
    x: x + 5,
    y: y + 5,
    width: width - 10,
    height: height - 10,
    borderColor: rgb(0.7, 0.7, 0.7),
    borderWidth: 1,
  });
  
  // Draw title
  const titleText = 'EVENT PASS';
  const titleSize = 16;
  page.drawText(titleText, {
    x: x + padding,
    y: y + height - padding - titleSize,
    size: titleSize,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  
  // Draw pass ID
  const passIdSize = 20;
  const passIdY = y + height - padding - titleSize - 30;
  page.drawText(pass.passId, {
    x: x + padding,
    y: passIdY,
    size: passIdSize,
    font: fontBold,
    color: rgb(0.2, 0.2, 0.8),
  });
  
  // Draw status if available
  if (pass.status) {
    const statusSize = 10;
    page.drawText(`Status: ${pass.status.toUpperCase()}`, {
      x: x + padding,
      y: passIdY - 20,
      size: statusSize,
      font: font,
      color: rgb(0.4, 0.4, 0.4),
    });
  }
  
  // Embed and draw QR code
  try {
    // Extract base64 data from data URL
    const base64Data = pass.qrDataUrl.split(',')[1];
    const qrImage = await pdfDoc.embedPng(base64Data);
    
    // Center QR code horizontally and place it in the middle-bottom area
    const qrX = x + (width - qrSize) / 2;
    const qrY = y + padding + 40;
    
    page.drawImage(qrImage, {
      x: qrX,
      y: qrY,
      width: qrSize,
      height: qrSize,
    });
    
    // Draw "Scan to verify" text below QR
    const scanText = 'Scan to verify';
    const scanTextSize = 10;
    const scanTextWidth = font.widthOfTextAtSize(scanText, scanTextSize);
    page.drawText(scanText, {
      x: x + (width - scanTextWidth) / 2,
      y: qrY - 15,
      size: scanTextSize,
      font: font,
      color: rgb(0.3, 0.3, 0.3),
    });
  } catch (error) {
    console.error('Error embedding QR code:', error);
    // Draw placeholder if QR code fails
    page.drawRectangle({
      x: x + (width - qrSize) / 2,
      y: y + padding + 40,
      width: qrSize,
      height: qrSize,
      borderColor: rgb(0.8, 0.8, 0.8),
      borderWidth: 1,
    });
  }
}

/**
 * Trigger download of PDF in browser
 * @param blob - PDF Blob to download
 * @param filename - Name for the downloaded file
 */
export function downloadPDF(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
