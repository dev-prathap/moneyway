'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { z } from 'zod';
import { Pass as PassModel } from '@/lib/models/pass';
import { 
  cachePass, 
  getPassFromCache, 
  queueOperation, 
  isOnline 
} from '@/lib/dexie';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Search, Wifi, WifiOff, CheckCircle, AlertCircle, User, Phone, MapPin, Calendar, Camera, Scan } from 'lucide-react';
import { CameraCapture } from '@/lib/components/CameraCapture';

interface Pass {
  passId: string;
  eventId: string;
  status: 'unused' | 'used';
  qrUrl: string;
  name?: string;
  mobile?: string;
  city?: string;
  age?: number | string;
  createdAt: string | Date;
  updatedAt: string | Date;
  usedAt?: string | Date;
}

const VisitorFormSchema = z.object({
  name: z.string().optional(),
  mobile: z.string().optional(),
  city: z.string().optional(),
  age: z.string().optional()
});

export default function ScanPassPage() {
  const params = useParams();
  const router = useRouter();
  const passId = params.passId as string;
  
  const [pass, setPass] = useState<Pass | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [offline, setOffline] = useState(false);
  const [markingAsUsed, setMarkingAsUsed] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Pass[]>([]);
  const [searching, setSearching] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    city: '',
    age: ''
  });
  
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showCamera, setShowCamera] = useState(false);
  const [processingImage, setProcessingImage] = useState(false);
  const [extractionResult, setExtractionResult] = useState<{name: string | null, phone: string | null} | null>(null);
  
  useEffect(() => {
    fetchPassDetails();
    // Clear any existing form errors since validation is disabled
    setFormErrors({});
  }, [passId]);
  
  const fetchPassDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const online = isOnline();
      setOffline(!online);
      
      if (online) {
        // Try to fetch from server
        try {
          const response = await fetch(`/api/passes/${passId}`);
          const data = await response.json();
          
          if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch pass details');
          }
          
          setPass(data.pass);
          
          // Cache the pass for offline use
          const passToCache: PassModel = {
            ...data.pass,
            createdAt: new Date(data.pass.createdAt),
            updatedAt: new Date(data.pass.updatedAt),
            usedAt: data.pass.usedAt ? new Date(data.pass.usedAt) : undefined
          };
          await cachePass(passToCache);
          
          // Pre-fill form if data exists
          if (data.pass.name) {
            setFormData({
              name: data.pass.name || '',
              mobile: data.pass.mobile || '',
              city: data.pass.city || '',
              age: data.pass.age?.toString() || ''
            });
          }
        } catch (err) {
          // If online fetch fails, try cache
          const cachedPass = await getPassFromCache(passId);
          if (cachedPass) {
            setPass(cachedPass);
            setOffline(true);
            if (cachedPass.name) {
              setFormData({
                name: cachedPass.name || '',
                mobile: cachedPass.mobile || '',
                city: cachedPass.city || '',
                age: cachedPass.age?.toString() || ''
              });
            }
          } else {
            throw err;
          }
        }
      } else {
        // Offline: fetch from IndexedDB
        const cachedPass = await getPassFromCache(passId);
        if (cachedPass) {
          setPass(cachedPass);
          if (cachedPass.name) {
            setFormData({
              name: cachedPass.name || '',
              mobile: cachedPass.mobile || '',
              city: cachedPass.city || '',
              age: cachedPass.age?.toString() || ''
            });
          }
        } else {
          throw new Error('Pass not found in offline cache');
        }
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear all form errors since validation is disabled
    setFormErrors({});
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await fetch(`/api/passes/search?passId=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        const passes = data.passes.map((pass: any) => ({
          ...pass,
          createdAt: new Date(pass.createdAt),
          updatedAt: new Date(pass.updatedAt),
          usedAt: pass.usedAt ? new Date(pass.usedAt) : undefined,
        }));
        setSearchResults(passes);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // Debounce search
    const timeoutId = setTimeout(() => {
      handleSearch(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  const handlePassSelect = (selectedPassId: string) => {
    router.push(`/scan/${selectedPassId}`);
  };

  const handleCameraCapture = async (imageData: string) => {
    setProcessingImage(true);
    setExtractionResult(null);
    
    try {
      const response = await fetch('/api/vision/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: imageData }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        setExtractionResult(result.data);
        
        // Auto-fill the form with extracted data
        setFormData(prev => ({
          ...prev,
          name: result.data.name || prev.name,
          mobile: result.data.phone || prev.mobile,
        }));

        const extractedItems = [];
        if (result.data.name) extractedItems.push(`Name: ${result.data.name}`);
        if (result.data.phone) extractedItems.push(`Phone: ${result.data.phone}`);
        
        setStatusMessage(
          extractedItems.length > 0 
            ? `✅ AI Extracted: ${extractedItems.join(', ')}` 
            : '⚠️ No name or phone number found in the image'
        );
        
        setTimeout(() => setStatusMessage(null), 5000);
      } else {
        setError('Failed to extract information from image');
        setTimeout(() => setError(null), 3000);
      }
    } catch (error) {
      console.error('Error processing image:', error);
      // Suppress extension errors - they don't affect functionality
      if (error instanceof Error && error.message.includes('control')) {
        console.log('Browser extension error - ignoring');
      } else {
        setError('Failed to process image');
        setTimeout(() => setError(null), 3000);
      }
    } finally {
      setProcessingImage(false);
      setShowCamera(false);
    }
  };

  const openCamera = () => {
    setShowCamera(true);
  };

  const closeCamera = () => {
    setShowCamera(false);
    setProcessingImage(false);
  };
  
  const handleMarkAsUsed = async () => {
    if (!pass) return;
    
    // Prevent duplicate check-ins (Requirement 11.4)
    if (pass.status === 'used') {
      setStatusMessage('This pass is already marked as used');
      setTimeout(() => setStatusMessage(null), 3000);
      return;
    }
    
    try {
      setMarkingAsUsed(true);
      setError(null);
      
      const online = isOnline();
      
      if (online) {
        // Try to update on server
        try {
          const response = await fetch('/api/passes/status', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              passId,
              status: 'used'
            })
          });
          
          const data = await response.json();
          
          if (!response.ok) {
            if (response.status === 409) {
              // Already marked as used
              setStatusMessage(data.error);
              setPass(prev => prev ? { ...prev, status: 'used' } : null);
            } else {
              throw new Error(data.error || 'Failed to update pass status');
            }
          } else {
            setStatusMessage('Pass marked as used successfully!');
            
            // Update local state
            const updatedPass = {
              ...data.pass,
              createdAt: new Date(data.pass.createdAt),
              updatedAt: new Date(data.pass.updatedAt),
              usedAt: data.pass.usedAt ? new Date(data.pass.usedAt) : undefined
            };
            setPass(updatedPass);
            
            // Update cache
            const passToCache: PassModel = {
              ...updatedPass,
              createdAt: updatedPass.createdAt,
              updatedAt: updatedPass.updatedAt,
              usedAt: updatedPass.usedAt
            };
            await cachePass(passToCache);
          }
          
          setTimeout(() => setStatusMessage(null), 5000);
        } catch (err) {
          // If online update fails, queue for later (Requirement 11.2)
          await queueOperation({
            type: 'update-status',
            passId,
            payload: { status: 'used' },
            createdAt: new Date(),
            retryCount: 0
          });
          
          // Update local cache
          const now = new Date();
          const updatedPass: PassModel = {
            ...pass,
            status: 'used',
            usedAt: now,
            updatedAt: now,
            createdAt: pass.createdAt instanceof Date ? pass.createdAt : new Date(pass.createdAt)
          };
          await cachePass(updatedPass);
          setPass(updatedPass);
          
          setStatusMessage('Pass marked as used (will sync when online)');
          setOffline(true);
          
          setTimeout(() => setStatusMessage(null), 5000);
        }
      } else {
        // Offline: queue operation (Requirement 11.2)
        await queueOperation({
          type: 'update-status',
          passId,
          payload: { status: 'used' },
          createdAt: new Date(),
          retryCount: 0
        });
        
        // Update local cache
        const now = new Date();
        const updatedPass: PassModel = {
          ...pass,
          status: 'used',
          usedAt: now,
          updatedAt: now,
          createdAt: pass.createdAt instanceof Date ? pass.createdAt : new Date(pass.createdAt)
        };
        await cachePass(updatedPass);
        setPass(updatedPass);
        
        setStatusMessage('Pass marked as used (will sync when online)');
        setOffline(true);
        
        setTimeout(() => setStatusMessage(null), 5000);
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setMarkingAsUsed(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Skip validation - allow any form data
    const validation = { success: true, data: formData };
    
    try {
      setSubmitting(true);
      setError(null);
      
      const online = isOnline();
      
      if (online) {
        // Try to update on server
        try {
          const response = await fetch('/api/passes/update', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              passId,
              ...validation.data
            })
          });
          
          const data = await response.json();
          
          if (!response.ok) {
            if (data.details) {
              const errors: Record<string, string> = {};
              data.details.forEach((issue: any) => {
                if (issue.path[0]) {
                  errors[issue.path[0].toString()] = issue.message;
                }
              });
              setFormErrors(errors);
            }
            throw new Error(data.error || 'Failed to update pass');
          }
          
          setSuccess(true);
          setPass(data.pass);
          
          // Update cache
          const passToCache: PassModel = {
            ...data.pass,
            createdAt: new Date(data.pass.createdAt),
            updatedAt: new Date(data.pass.updatedAt),
            usedAt: data.pass.usedAt ? new Date(data.pass.usedAt) : undefined
          };
          await cachePass(passToCache);
          
          // Automatically mark as used after successful form submission
          if (data.pass.status === 'unused') {
            setTimeout(() => {
              handleMarkAsUsed();
            }, 1000); // Wait 1 second after form success
          }
          
          // Reset success message after 5 seconds
          setTimeout(() => {
            setSuccess(false);
          }, 5000);
        } catch (err) {
          // If online update fails, queue for later
          await queueOperation({
            type: 'update-pass',
            passId,
            payload: validation.data,
            createdAt: new Date(),
            retryCount: 0
          });
          
          // Update local cache
          const updatedPass: PassModel = {
            ...pass!,
            ...validation.data,
            createdAt: pass!.createdAt instanceof Date ? pass!.createdAt : new Date(pass!.createdAt),
            updatedAt: new Date(),
            usedAt: pass!.usedAt ? (pass!.usedAt instanceof Date ? pass!.usedAt : new Date(pass!.usedAt)) : undefined
          };
          await cachePass(updatedPass);
          setPass(updatedPass);
          
          setSuccess(true);
          setOffline(true);
          
          // Automatically mark as used after successful form submission (offline)
          if (updatedPass.status === 'unused') {
            setTimeout(() => {
              handleMarkAsUsed();
            }, 1000); // Wait 1 second after form success
          }
          
          setTimeout(() => {
            setSuccess(false);
          }, 5000);
        }
      } else {
        // Offline: queue operation
        await queueOperation({
          type: 'update-pass',
          passId,
          payload: validation.data,
          createdAt: new Date(),
          retryCount: 0
        });
        
        // Update local cache
        const updatedPass: PassModel = {
          ...pass!,
          ...validation.data,
          createdAt: pass!.createdAt instanceof Date ? pass!.createdAt : new Date(pass!.createdAt),
          updatedAt: new Date(),
          usedAt: pass!.usedAt ? (pass!.usedAt instanceof Date ? pass!.usedAt : new Date(pass!.usedAt)) : undefined
        };
        await cachePass(updatedPass);
        setPass(updatedPass);
        
        setSuccess(true);
        setOffline(true);
        
        // Automatically mark as used after successful form submission (pure offline)
        if (updatedPass.status === 'unused') {
          setTimeout(() => {
            handleMarkAsUsed();
          }, 1000); // Wait 1 second after form success
        }
        
        setTimeout(() => {
          setSuccess(false);
        }, 5000);
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading pass details...</p>
        </div>
      </div>
    );
  }
  
  if (error && !pass) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => router.push('/')}
              className="bg-gray-900 text-white px-6 py-2 rounded-md hover:bg-gray-800"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Search className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Pass Scanner</h1>
          </div>
          <div className="flex items-center gap-2">
            {offline ? (
              <Badge variant="destructive" className="gap-1">
                <WifiOff className="h-3 w-3" />
                Offline
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1">
                <Wifi className="h-3 w-3" />
                Online
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboard')}
            >
              Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-6 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Search Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Quick Search
              </CardTitle>
              <CardDescription>
                Search for visitor passes by Pass ID (e.g., VIS-0001)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Enter Pass ID to search..."
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  className="pl-10"
                />
              </div>
              
              {/* Search Results */}
              {searchQuery && (
                <div className="mt-4">
                  {searching ? (
                    <div className="text-center py-4">
                      <div className="text-sm text-muted-foreground">Searching...</div>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Search Results:</div>
                      {searchResults.map((result) => (
                        <div
                          key={result.passId}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                          onClick={() => handlePassSelect(result.passId)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="font-mono text-sm font-medium">{result.passId}</div>
                            <Badge variant={result.status === 'used' ? 'default' : 'secondary'}>
                              {result.status}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {result.name || 'No name'}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <div className="text-sm text-muted-foreground">No passes found</div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Offline Warning */}
          {offline && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <WifiOff className="h-5 w-5 text-yellow-600" />
                  <div>
                    <div className="font-semibold text-yellow-900">Working Offline</div>
                    <div className="text-sm text-yellow-700">Changes will sync when you're back online.</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          {/* Visitor Form */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {pass?.name ? 'Update Your Information' : 'Enter Your Information'}
                  </CardTitle>
                  <CardDescription>
                    Fill in your details to complete the visitor registration
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={openCamera}
                  className="gap-2"
                  disabled={processingImage}
                >
                  <Scan className="h-4 w-4" />
                  {processingImage ? 'Processing...' : 'Scan Document'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium">
                      Name
                    </label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="mobile" className="text-sm font-medium">
                      Mobile Number
                    </label>
                    <Input
                      id="mobile"
                      name="mobile"
                      type="tel"
                      value={formData.mobile}
                      onChange={handleInputChange}
                      placeholder="Enter your mobile number"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="city" className="text-sm font-medium">
                      City
                    </label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="Enter your city"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="age" className="text-sm font-medium">
                      Age
                    </label>
                    <Input
                      id="age"
                      name="age"
                      type="number"
                      value={formData.age}
                      onChange={handleInputChange}
                      placeholder="Enter your age"
                      min="1"
                      max="150"
                    />
                  </div>
                </div>
                
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full"
                  size="lg"
                >
                  {submitting ? 'Updating...' : pass?.name ? 'Update Information' : 'Submit Information'}
                </Button>
              </form>
            </CardContent>
          </Card>
          {/* Status Messages */}
          {statusMessage && (
            <Card className={
              statusMessage.includes('already') || statusMessage.includes('error')
                ? 'border-yellow-200 bg-yellow-50'
                : 'border-green-200 bg-green-50'
            }>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  {statusMessage.includes('already') || statusMessage.includes('error') ? (
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  )}
                  <div className={`font-medium ${
                    statusMessage.includes('already') || statusMessage.includes('error')
                      ? 'text-yellow-900'
                      : 'text-green-900'
                  }`}>
                    {statusMessage}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {success && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="font-semibold text-green-900">Success!</div>
                    <div className="text-sm text-green-700">Your information has been updated successfully.</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {error && pass && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <div>
                    <div className="font-semibold text-red-900">Error</div>
                    <div className="text-sm text-red-700">{error}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          {/* Pass Details Card */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Pass Details
                  </CardTitle>
                  <CardDescription>
                    Current pass information and status
                  </CardDescription>
                </div>
                {pass?.status === 'unused' && (
                  <Button
                    onClick={handleMarkAsUsed}
                    disabled={markingAsUsed}
                    className="gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    {markingAsUsed ? 'Marking...' : 'Mark as Used'}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Pass ID</div>
                  <div className="font-mono font-semibold">{pass?.passId}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Status</div>
                  <Badge variant={pass?.status === 'used' ? 'default' : 'secondary'}>
                    {pass?.status?.toUpperCase()}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Event ID</div>
                  <div className="text-sm font-medium">{pass?.eventId}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Created</div>
                  <div className="text-sm font-medium">
                    {pass?.createdAt ? new Date(pass.createdAt).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
                {pass?.usedAt && (
                  <div className="col-span-2 space-y-1">
                    <div className="text-sm text-muted-foreground">Used At</div>
                    <div className="text-sm font-medium">
                      {new Date(pass.usedAt).toLocaleString()}
                    </div>
                  </div>
                )}
              </div>
              
              {pass?.name && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <div className="text-sm font-medium">Current Visitor Information</div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-xs text-muted-foreground">Name</div>
                          <div className="text-sm font-medium">{pass.name}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-xs text-muted-foreground">Mobile</div>
                          <div className="text-sm font-medium">{pass.mobile}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-xs text-muted-foreground">City</div>
                          <div className="text-sm font-medium">{pass.city}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-xs text-muted-foreground">Age</div>
                          <div className="text-sm font-medium">{pass.age}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          
          
          
          
        </div>
      </main>

      {/* Camera Component */}
      {showCamera && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={closeCamera}
          isProcessing={processingImage}
        />
      )}
    </div>
  );
}
