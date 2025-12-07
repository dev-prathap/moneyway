'use client';

import { useState } from 'react';
import { generatePassPDF, downloadPDF } from '@/lib/pdf-generator';

interface Pass {
  passId: string;
  qrUrl: string;
  qrDataUrl?: string;
  status: string;
}

export default function GenerateForm() {
  const [prefix, setPrefix] = useState('VIS');
  const [count, setCount] = useState(10);
  const [eventId, setEventId] = useState('EVT-001');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ count: number; passes: Pass[] } | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/passes/create-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId,
          prefix,
          count,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate passes');
      }

      setSuccess(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!success || !success.passes) {
      return;
    }

    setPdfLoading(true);
    setError(null);

    try {
      // Filter passes that have QR data URLs
      const passesWithQR = success.passes.filter(p => p.qrDataUrl);
      
      if (passesWithQR.length === 0) {
        throw new Error('No passes with QR codes available for PDF generation');
      }

      // Generate PDF
      const pdfBlob = await generatePassPDF(
        passesWithQR.map(p => ({
          passId: p.passId,
          qrDataUrl: p.qrDataUrl!,
          status: p.status
        }))
      );

      // Trigger download
      const filename = `passes-${prefix}-${new Date().toISOString().split('T')[0]}.pdf`;
      downloadPDF(pdfBlob, filename);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="eventId" className="block text-sm font-medium text-gray-700">
            Event ID
          </label>
          <input
            type="text"
            id="eventId"
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            required
          />
          <p className="mt-1 text-sm text-gray-500">
            The event these passes belong to (e.g., EVT-001)
          </p>
        </div>

        <div>
          <label htmlFor="prefix" className="block text-sm font-medium text-gray-700">
            Pass Prefix
          </label>
          <input
            type="text"
            id="prefix"
            value={prefix}
            onChange={(e) => setPrefix(e.target.value.toUpperCase())}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            maxLength={10}
            required
          />
          <p className="mt-1 text-sm text-gray-500">
            Prefix for pass IDs (e.g., VIS for VIS-0001)
          </p>
        </div>

        <div>
          <label htmlFor="count" className="block text-sm font-medium text-gray-700">
            Number of Passes
          </label>
          <input
            type="number"
            id="count"
            value={count}
            onChange={(e) => setCount(parseInt(e.target.value, 10))}
            min={1}
            max={1000}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            required
          />
          <p className="mt-1 text-sm text-gray-500">
            How many passes to generate (1-1000)
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Generating...' : 'Generate Passes'}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="mt-6">
          <div className="p-4 bg-green-50 border border-green-200 rounded-md mb-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-green-800">
                Successfully generated {success.count} passes!
              </p>
              <button
                onClick={handleDownloadPDF}
                disabled={pdfLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {pdfLoading ? 'Generating PDF...' : 'Download PDF'}
              </button>
            </div>
          </div>

          <div className="border border-gray-200 rounded-md overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-900">Generated Passes</h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pass ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      QR URL
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {success.passes.map((pass) => (
                    <tr key={pass.passId}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {pass.passId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {pass.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <a
                          href={pass.qrUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {pass.qrUrl}
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
