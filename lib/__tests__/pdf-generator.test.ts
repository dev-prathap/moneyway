import { generatePassPDF, PassForPDF } from '../pdf-generator';

describe('PDF Generator', () => {
  // Helper to create a mock QR data URL
  const createMockQRDataUrl = () => {
    // Create a minimal 1x1 PNG data URL
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  };

  describe('generatePassPDF', () => {
    it('should generate a PDF blob', async () => {
      const passes: PassForPDF[] = [
        {
          passId: 'VIS-0001',
          qrDataUrl: createMockQRDataUrl(),
          status: 'unused'
        }
      ];

      const pdfBlob = await generatePassPDF(passes);

      expect(pdfBlob).toBeInstanceOf(Blob);
      expect(pdfBlob.type).toBe('application/pdf');
      expect(pdfBlob.size).toBeGreaterThan(0);
    });

    it('should handle 4 passes on a single page', async () => {
      const passes: PassForPDF[] = Array.from({ length: 4 }, (_, i) => ({
        passId: `VIS-${String(i + 1).padStart(4, '0')}`,
        qrDataUrl: createMockQRDataUrl(),
        status: 'unused'
      }));

      const pdfBlob = await generatePassPDF(passes);

      expect(pdfBlob).toBeInstanceOf(Blob);
      expect(pdfBlob.size).toBeGreaterThan(0);
    });

    it('should handle partial pages (non-divisible by 4)', async () => {
      // Test with 5 passes (should create 2 pages)
      const passes: PassForPDF[] = Array.from({ length: 5 }, (_, i) => ({
        passId: `VIS-${String(i + 1).padStart(4, '0')}`,
        qrDataUrl: createMockQRDataUrl(),
        status: 'unused'
      }));

      const pdfBlob = await generatePassPDF(passes);

      expect(pdfBlob).toBeInstanceOf(Blob);
      expect(pdfBlob.size).toBeGreaterThan(0);
    });

    it('should handle 1 pass', async () => {
      const passes: PassForPDF[] = [
        {
          passId: 'VIS-0001',
          qrDataUrl: createMockQRDataUrl(),
          status: 'unused'
        }
      ];

      const pdfBlob = await generatePassPDF(passes);

      expect(pdfBlob).toBeInstanceOf(Blob);
      expect(pdfBlob.size).toBeGreaterThan(0);
    });

    it('should handle 10 passes (3 pages)', async () => {
      const passes: PassForPDF[] = Array.from({ length: 10 }, (_, i) => ({
        passId: `VIS-${String(i + 1).padStart(4, '0')}`,
        qrDataUrl: createMockQRDataUrl(),
        status: 'unused'
      }));

      const pdfBlob = await generatePassPDF(passes);

      expect(pdfBlob).toBeInstanceOf(Blob);
      expect(pdfBlob.size).toBeGreaterThan(0);
    });

    it('should handle passes without status', async () => {
      const passes: PassForPDF[] = [
        {
          passId: 'VIS-0001',
          qrDataUrl: createMockQRDataUrl()
        }
      ];

      const pdfBlob = await generatePassPDF(passes);

      expect(pdfBlob).toBeInstanceOf(Blob);
      expect(pdfBlob.size).toBeGreaterThan(0);
    });

    it('should handle empty pass array', async () => {
      const passes: PassForPDF[] = [];

      const pdfBlob = await generatePassPDF(passes);

      expect(pdfBlob).toBeInstanceOf(Blob);
      expect(pdfBlob.type).toBe('application/pdf');
      // Empty PDF should still have some size (PDF structure)
      expect(pdfBlob.size).toBeGreaterThan(0);
    });
  });
});
