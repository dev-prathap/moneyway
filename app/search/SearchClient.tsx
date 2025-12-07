'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { JWTPayload } from '@/lib/auth';
import { Pass } from '@/lib/models/pass';
import { searchPassesInCache, isOnline } from '@/lib/dexie';

interface SearchClientProps {
  user: JWTPayload;
}

export default function SearchClient({ user }: SearchClientProps) {
  const router = useRouter();
  const [searchType, setSearchType] = useState<'passId' | 'mobile'>('passId');
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Pass[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [offline, setOffline] = useState(false);
  const [generatedCards, setGeneratedCards] = useState<any[]>([]);
  const [loadingCards, setLoadingCards] = useState(false);

  // Load generated cards
  const loadGeneratedCards = async () => {
    setLoadingCards(true);
    try {
      const response = await fetch('/api/passes/check-visitor-cards?limit=100');
      if (response.ok) {
        const data = await response.json();
        setGeneratedCards(data.recentPasses || []);
      }
    } catch (error) {
      console.error('Error loading generated cards:', error);
    } finally {
      setLoadingCards(false);
    }
  };

  // Auto-search for visitor cards on page load
  useEffect(() => {
    const loadVisitorCards = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/passes/search?passId=VIS-');
        if (response.ok) {
          const data = await response.json();
          const passes = data.passes.map((pass: any) => ({
            ...pass,
            createdAt: new Date(pass.createdAt),
            updatedAt: new Date(pass.updatedAt),
            usedAt: pass.usedAt ? new Date(pass.usedAt) : undefined,
          }));
          setResults(passes);
          setSearched(true);
        }
      } catch (err) {
        console.error('Error loading visitor cards:', err);
      } finally {
        setLoading(false);
      }
    };

    loadVisitorCards();
    loadGeneratedCards(); // Also load generated cards
  }, []);

  useEffect(() => {
    // Check initial online status
    setOffline(!isOnline());

    // Set up online/offline listeners
    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  // Instant search as user types
  useEffect(() => {
    if (!searchQuery.trim()) {
      // If empty, show all visitor cards
      const loadVisitorCards = async () => {
        setLoading(true);
        try {
          const response = await fetch('/api/passes/search?passId=VIS-');
          if (response.ok) {
            const data = await response.json();
            const passes = data.passes.map((pass: any) => ({
              ...pass,
              createdAt: new Date(pass.createdAt),
              updatedAt: new Date(pass.updatedAt),
              usedAt: pass.usedAt ? new Date(pass.usedAt) : undefined,
            }));
            setResults(passes);
          }
        } catch (err) {
          console.error('Error loading visitor cards:', err);
        } finally {
          setLoading(false);
        }
      };
      loadVisitorCards();
      return;
    }

    // Debounce search
    const timeoutId = setTimeout(async () => {
      setLoading(true);
      setError(null);
      
      try {
        const params = new URLSearchParams();
        params.set(searchType, searchQuery.trim());

        const response = await fetch(`/api/passes/search?${params.toString()}`);
        
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Search failed');
        }

        const data = await response.json();
        
        const passes = data.passes.map((pass: any) => ({
          ...pass,
          createdAt: new Date(pass.createdAt),
          updatedAt: new Date(pass.updatedAt),
          usedAt: pass.usedAt ? new Date(pass.usedAt) : undefined,
        }));
        
        setResults(passes);
      } catch (err) {
        console.error('Search error:', err);
        setError(err instanceof Error ? err.message : 'An error occurred during search');
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchType]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    // Search is handled by useEffect above
  };

  const handlePassIdClick = (passId: string) => {
    // Navigate to generate-cards with the pass ID pre-filled
    router.push(`/generate-cards?passId=${passId}`);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Search Visitor Cards</h1>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Back to Dashboard
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Offline Indicator */}
          {offline && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <span className="text-yellow-500 text-2xl mr-3">📡</span>
                <div>
                  <h3 className="font-semibold text-yellow-900">Searching Offline</h3>
                  <p className="text-yellow-700 text-sm">
                    You're currently offline. Searching from cached data.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Search Form */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <form onSubmit={handleSearch}>
              <div className="space-y-4">
                {/* Search Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search By
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="passId"
                        checked={searchType === 'passId'}
                        onChange={(e) => setSearchType(e.target.value as 'passId')}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Pass ID</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="mobile"
                        checked={searchType === 'mobile'}
                        onChange={(e) => setSearchType(e.target.value as 'mobile')}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Mobile Number</span>
                    </label>
                  </div>
                </div>

                {/* Search Input */}
                <div>
                  <label htmlFor="searchQuery" className="block text-sm font-medium text-gray-700 mb-2">
                    {searchType === 'passId' ? 'Pass ID' : 'Mobile Number'}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      id="searchQuery"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={searchType === 'passId' ? 'e.g., VIS-0001' : 'e.g., 9876543210'}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                    >
                      {loading ? 'Searching...' : 'Search'}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <span className="text-red-500 text-2xl mr-3">⚠️</span>
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* Search Results */}
          {searched && !loading && (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">
                  Search Results
                  {results.length > 0 && (
                    <span className="ml-2 text-sm text-gray-500">
                      ({results.length} {results.length === 1 ? 'result' : 'results'})
                    </span>
                  )}
                </h2>
              </div>

              {results.length === 0 ? (
                <div className="px-6 py-8 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="mt-2 text-sm text-gray-500">No results found</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Try searching with a different {searchType === 'passId' ? 'pass ID' : 'mobile number'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
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
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Mobile
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          City
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Age
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {results.map((pass) => (
                        <tr key={pass.passId} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handlePassIdClick(pass.passId)}
                              className="text-indigo-600 hover:text-indigo-900 font-medium hover:underline cursor-pointer"
                            >
                              {pass.passId}
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                pass.status === 'used'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {pass.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {pass.name || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {pass.mobile || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {pass.city || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {pass.age || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(pass.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => router.push(`/scan/${pass.passId}`)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Generated Cards Table */}
          <div className="bg-white shadow rounded-lg overflow-hidden mt-6">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">
                Generated Visitor Cards
                {generatedCards.length > 0 && (
                  <span className="ml-2 text-sm text-gray-500">
                    ({generatedCards.length} cards)
                  </span>
                )}
              </h2>
              <button
                onClick={loadGeneratedCards}
                disabled={loadingCards}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                {loadingCards ? 'Loading...' : 'Refresh'}
              </button>
            </div>

            {loadingCards ? (
              <div className="px-6 py-8 text-center">
                <div className="text-sm text-gray-500">Loading generated cards...</div>
              </div>
            ) : generatedCards.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p className="mt-2 text-sm text-gray-500">No cards generated yet</p>
                <p className="text-xs text-gray-400 mt-1">
                  Generate visitor cards to see them here
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
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
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {generatedCards.map((card, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center">
                            <span className="font-mono text-gray-900">{card.passId}</span>
                            {card.isDuplicate && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                DUP
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              card.status === 'used'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {card.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {card.isDuplicate ? 'Duplicate' : 'Original'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(card.createdAt).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => {
                              const cleanPassId = card.passId.replace('-DUP', '');
                              router.push(`/generate-cards?passId=${cleanPassId}`);
                            }}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => router.push(`/scan/${card.passId.replace('-DUP', '')}`)}
                            className="text-green-600 hover:text-green-900"
                          >
                            View
                          </button>
                          <button
                            onClick={() => {
                              const cleanPassId = card.passId.replace('-DUP', '');
                              navigator.clipboard.writeText(cleanPassId);
                              alert('Pass ID copied to clipboard!');
                            }}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            Copy
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
