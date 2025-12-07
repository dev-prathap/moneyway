'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { JWTPayload } from '@/lib/auth';
import { 
  getPendingOperationsCount, 
  isOnline, 
  addOnlineListener, 
  addOfflineListener,
  removeOnlineListener,
  removeOfflineListener
} from '@/lib/dexie';
import { triggerManualSync, setupAutoSync } from '@/lib/sync';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { 
  LayoutDashboard, 
  FileText, 
  CheckCircle, 
  Clock, 
  Plus, 
  Search, 
  Wifi, 
  WifiOff, 
  RefreshCw,
  User,
  LogOut,
  Settings,
  Bell
} from 'lucide-react';

interface DashboardClientProps {
  user: JWTPayload;
  stats: {
    totalPasses: number;
    usedPasses: number;
    unusedPasses: number;
  };
}

export default function DashboardClient({ user, stats }: DashboardClientProps) {
  const router = useRouter();
  const [pendingOpsCount, setPendingOpsCount] = useState(0);
  const [offline, setOffline] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  useEffect(() => {
    // Check initial online status
    setOffline(!isOnline());
    
    // Load pending operations count
    loadPendingOpsCount();
    
    // Set up auto-sync on reconnection
    setupAutoSync();
    
    // Set up online/offline listeners
    const handleOnline = () => {
      setOffline(false);
      loadPendingOpsCount();
    };
    
    const handleOffline = () => {
      setOffline(true);
    };
    
    // Listen for sync completion events
    const handleSyncComplete = (event: any) => {
      const result = event.detail;
      setSyncMessage(`Synced ${result.synced} operations successfully`);
      loadPendingOpsCount();
      
      setTimeout(() => {
        setSyncMessage(null);
      }, 5000);
    };
    
    addOnlineListener(handleOnline);
    addOfflineListener(handleOffline);
    window.addEventListener('sync-complete', handleSyncComplete);
    
    // Refresh count every 10 seconds
    const interval = setInterval(loadPendingOpsCount, 10000);
    
    return () => {
      removeOnlineListener(handleOnline);
      removeOfflineListener(handleOffline);
      window.removeEventListener('sync-complete', handleSyncComplete);
      clearInterval(interval);
    };
  }, []);
  
  const loadPendingOpsCount = async () => {
    try {
      const count = await getPendingOperationsCount();
      setPendingOpsCount(count);
    } catch (error) {
      console.error('Error loading pending operations count:', error);
    }
  };
  
  const handleManualSync = async () => {
    if (offline) {
      setSyncMessage('Cannot sync while offline');
      setTimeout(() => setSyncMessage(null), 3000);
      return;
    }
    
    if (pendingOpsCount === 0) {
      setSyncMessage('No pending operations to sync');
      setTimeout(() => setSyncMessage(null), 3000);
      return;
    }
    
    try {
      setSyncing(true);
      setSyncMessage('Syncing...');
      
      const result = await triggerManualSync();
      
      if (result.success) {
        setSyncMessage(`Successfully synced ${result.synced} operations`);
      } else {
        setSyncMessage(`Synced ${result.synced} operations, ${result.failed} failed`);
      }
      
      await loadPendingOpsCount();
      
      setTimeout(() => {
        setSyncMessage(null);
      }, 5000);
    } catch (error) {
      console.error('Manual sync error:', error);
      setSyncMessage('Sync failed. Please try again.');
      setTimeout(() => setSyncMessage(null), 5000);
    } finally {
      setSyncing(false);
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (response.ok) {
        router.push('/login');
        router.refresh();
      } else {
        console.error('Logout failed');
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Modern Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Maniway Pass Maker</h1>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Connection Status */}
            <div className="flex items-center gap-2">
              {offline ? (
                <Badge variant="secondary" className="gap-1">
                  <WifiOff className="h-3 w-3" />
                  Offline
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1">
                  <Wifi className="h-3 w-3" />
                  Online
                </Badge>
              )}
            </div>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {user.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.username}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      Administrator
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto py-6 px-4">
        <div className="space-y-6">
          {/* Status Alerts */}
          {offline && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <WifiOff className="h-5 w-5 text-yellow-600" />
                    <div>
                      <h3 className="font-semibold text-yellow-900">Working Offline</h3>
                      <p className="text-sm text-yellow-700">
                        You're currently offline. Changes will sync when you're back online.
                      </p>
                    </div>
                  </div>
                  {pendingOpsCount > 0 && (
                    <Badge variant="secondary">
                      {pendingOpsCount} pending
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          
          {!offline && pendingOpsCount > 0 && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <RefreshCw className="h-5 w-5 text-blue-600" />
                    <div>
                      <h3 className="font-semibold text-blue-900">Pending Sync Operations</h3>
                      <p className="text-sm text-blue-700">
                        {pendingOpsCount} operation(s) waiting to be synchronized.
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={handleManualSync}
                    disabled={syncing}
                    size="sm"
                    className="gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                    {syncing ? 'Syncing...' : 'Sync Now'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          
          {syncMessage && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <p className="text-sm font-medium text-green-700">{syncMessage}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Passes</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalPasses}</div>
                <p className="text-xs text-muted-foreground">
                  All generated passes
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Used Passes</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.usedPasses}</div>
                <p className="text-xs text-muted-foreground">
                  Successfully scanned
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unused Passes</CardTitle>
                <Clock className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.unusedPasses}</div>
                <p className="text-xs text-muted-foreground">
                  Awaiting use
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Manage your passes and access key features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={() => router.push('/search')}
                  variant="outline"
                  className="h-20 gap-3"
                  size="lg"
                >
                  <Search className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-semibold">Search Passes</div>
                    <div className="text-sm opacity-80">Find and manage passes</div>
                  </div>
                </Button>

                <Button
                  onClick={() => router.push('/generate-cards')}
                  className="h-20 gap-3"
                  size="lg"
                >
                  <FileText className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-semibold">Generate Cards</div>
                    <div className="text-sm opacity-80">Generate visitor cards</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
