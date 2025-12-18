'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Phone, Calendar, RefreshCw, Download } from 'lucide-react';

interface Visitor {
  visNumber: string;
  name: string;
  phoneNumber: string;
  createdAt: string;
  status: string;
}

export default function VisitorsPage() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVisitors = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/visitors');
      const result = await response.json();
      
      if (result.success) {
        setVisitors(result.data);
      } else {
        setError('Failed to fetch visitors');
      }
    } catch (err) {
      setError('Error loading visitors');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitors();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'used': return 'bg-green-100 text-green-800';
      case 'unused': return 'bg-blue-100 text-blue-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const downloadVisitorsTXT = () => {
    if (visitors.length === 0) {
      alert('No visitor data to download');
      return;
    }

    // Create text content
    let textContent = 'MANIWAY PASS MAKER - VISITORS DATABASE\n';
    textContent += '=====================================\n\n';
    textContent += `Generated on: ${new Date().toLocaleString('en-IN')}\n`;
    textContent += `Total Visitors: ${visitors.length}\n\n`;
    textContent += 'VIS NUMBER\t\tNAME\t\t\t\tPHONE NUMBER\t\tSTATUS\t\tCREATED DATE\n';
    textContent += '='.repeat(100) + '\n';

    visitors.forEach((visitor, index) => {
      const createdDate = new Date(visitor.createdAt).toLocaleDateString('en-IN');
      textContent += `${visitor.visNumber}\t\t${visitor.name.padEnd(20)}\t\t${visitor.phoneNumber}\t\t${visitor.status.toUpperCase()}\t\t${createdDate}\n`;
    });

    textContent += '\n' + '='.repeat(100) + '\n';
    textContent += `End of Report - Total ${visitors.length} visitors\n`;

    // Create and download file
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `visitors-database-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const downloadVisitorsCSV = () => {
    if (visitors.length === 0) {
      alert('No visitor data to download');
      return;
    }

    // Create CSV content
    let csvContent = 'VIS Number,Name,Phone Number,Status,Created Date\n';
    
    visitors.forEach((visitor) => {
      const createdDate = new Date(visitor.createdAt).toLocaleDateString('en-IN');
      // Escape commas and quotes in data
      const name = `"${visitor.name.replace(/"/g, '""')}"`;
      const phone = `"${visitor.phoneNumber}"`;
      const status = visitor.status.toUpperCase();
      const date = `"${createdDate}"`;
      
      csvContent += `${visitor.visNumber},${name},${phone},${status},${date}\n`;
    });

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `visitors-database-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Visitors Database</h1>
          <p className="text-gray-600 mt-1">
            VIS numbers with name and phone number data
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={downloadVisitorsTXT} 
            disabled={loading || visitors.length === 0}
            variant="outline" 
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Download TXT
          </Button>
          <Button 
            onClick={downloadVisitorsCSV} 
            disabled={loading || visitors.length === 0}
            variant="outline" 
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Download CSV
          </Button>
          <Button onClick={fetchVisitors} disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Visitors</p>
                <p className="text-2xl font-bold text-gray-900">{visitors.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Phone className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">With Phone</p>
                <p className="text-2xl font-bold text-gray-900">
                  {visitors.filter(v => v.phoneNumber).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Calendar className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Today</p>
                <p className="text-2xl font-bold text-gray-900">
                  {visitors.filter(v => 
                    new Date(v.createdAt).toDateString() === new Date().toDateString()
                  ).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error State */}
      {error && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <p>{error}</p>
              <Button onClick={fetchVisitors} className="mt-2">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">Loading visitors...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Visitors Table */}
      {!loading && !error && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Visitors List ({visitors.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {visitors.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No visitors found with name and phone number</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left p-4 font-semibold text-gray-900">VIS Number</th>
                      <th className="text-left p-4 font-semibold text-gray-900">Name</th>
                      <th className="text-left p-4 font-semibold text-gray-900">Phone Number</th>
                      <th className="text-left p-4 font-semibold text-gray-900">Status</th>
                      <th className="text-left p-4 font-semibold text-gray-900">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visitors.map((visitor, index) => (
                      <tr key={visitor.visNumber} className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                        <td className="p-4">
                          <span className="font-mono text-sm font-medium text-blue-600">
                            {visitor.visNumber}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="font-medium text-gray-900">
                            {visitor.name}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="font-mono text-sm text-gray-700">
                            {visitor.phoneNumber}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(visitor.status)}`}>
                            {visitor.status}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="text-sm text-gray-600">
                            {formatDate(visitor.createdAt)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
