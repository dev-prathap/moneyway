'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import domtoimage from 'dom-to-image';
import { VisitorCard } from '@/lib/components/VisitorCard';
import { VisitorData } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { 
  Download, 
  Eye, 
  RefreshCw, 
  CreditCard, 
  Calendar, 
  MapPin, 
  User,
  FileText
} from 'lucide-react';

const visitorFormSchema = z.object({
  visitorId: z.string().optional(),
  type: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  location: z.string().optional(),
  // Bulk generation fields
  bulkMode: z.boolean(),
  duplicateCards: z.boolean(),
  startId: z.string().optional(),
  endId: z.string().optional(),
  cardCount: z.string().optional(),
});

type VisitorFormData = z.infer<typeof visitorFormSchema>;

export default function VisitorCardDemo() {
  const [visitorData, setVisitorData] = useState<VisitorData>({
    visitorId: 'VIS-0001',
    type: 'VISITOR',
    startDate: '2024-01-15',
    endDate: '2024-01-20',
    location: 'Main Building',
  });

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isBulkGenerating, setIsBulkGenerating] = useState(false);
  const [generatedCards, setGeneratedCards] = useState<any[]>([]);
  const [loadingCards, setLoadingCards] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const form = useForm<VisitorFormData>({
    resolver: zodResolver(visitorFormSchema),
    defaultValues: {
      ...visitorData,
      bulkMode: false,
      duplicateCards: false,
      startId: '',
      endId: '',
      cardCount: '',
    },
  });

  // Load generated cards
  const loadGeneratedCards = async () => {
    setLoadingCards(true);
    try {
      const response = await fetch('/api/passes/check-visitor-cards?limit=50');
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

  // Check for passId in URL parameters and load generated cards
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const passId = urlParams.get('passId');
    
    if (passId) {
      // Pre-fill form with the selected pass ID
      setVisitorData(prev => ({
        ...prev,
        visitorId: passId
      }));
      
      // Also update the form values
      form.setValue('visitorId', passId);
    }

    // Load generated cards on page load
    loadGeneratedCards();
  }, [form]);

  const onSubmit = (data: VisitorFormData) => {
    if (data.bulkMode) {
      generateBulkCards(data);
    } else {
      setVisitorData(data);
    }
  };

  const generatePDFAlternative = async () => {
    if (!cardRef.current) {
      console.error('Card reference not found');
      alert('Card not found. Please try again.');
      return;
    }

    setIsGeneratingPDF(true);
    console.log('Starting alternative PDF generation...');
    
    try {
      // Use dom-to-image as alternative
      const dataUrl = await domtoimage.toPng(cardRef.current, {
        quality: 1.0,
        bgcolor: '#ffffff',
        width: cardRef.current.offsetWidth,
        height: cardRef.current.offsetHeight,
      });

      console.log('Image generated with dom-to-image');

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Calculate dimensions
      const pdfWidth = 210;
      const pdfHeight = 297;
      const cardWidth = 80;
      const cardHeight = 140; // Fixed height for visitor card
      const x = (pdfWidth - cardWidth) / 2;
      const y = (pdfHeight - cardHeight) / 2;

      pdf.addImage(dataUrl, 'PNG', x, y, cardWidth, cardHeight);
      
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `visitor-card-${visitorData.visitorId}-${timestamp}.pdf`;
      
      pdf.save(filename);
      alert('PDF downloaded successfully!');
    } catch (error) {
      console.error('Alternative PDF generation failed:', error);
      // Fall back to original method
      return generatePDFOriginal();
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const generatePDFOriginal = async () => {
    if (!cardRef.current) {
      console.error('Card reference not found');
      alert('Card not found. Please try again.');
      return;
    }

    setIsGeneratingPDF(true);
    console.log('Starting PDF generation...');
    
    try {
      // Create a temporary container with inline styles to avoid CSS issues
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.background = '#ffffff';
      tempContainer.style.padding = '20px';
      tempContainer.style.fontFamily = 'Arial, sans-serif';
      document.body.appendChild(tempContainer);

      // Clone the card and apply inline styles
      const cardClone = cardRef.current.cloneNode(true) as HTMLElement;
      
      // Convert CSS classes to inline styles to avoid parsing issues
      const applyInlineStyles = (element: HTMLElement) => {
        // Apply basic styles inline
        if (element.classList.contains('text-maniway-blue')) {
          element.style.color = '#1e3a8a';
        }
        if (element.classList.contains('bg-maniway-yellow')) {
          element.style.backgroundColor = '#fbbf24';
        }
        if (element.classList.contains('text-maniway-red')) {
          element.style.color = '#dc2626';
        }
        if (element.classList.contains('bg-white')) {
          element.style.backgroundColor = '#ffffff';
        }
        
        // Recursively apply to children
        Array.from(element.children).forEach(child => {
          if (child instanceof HTMLElement) {
            applyInlineStyles(child);
          }
        });
      };

      applyInlineStyles(cardClone);
      tempContainer.appendChild(cardClone);

      console.log('Capturing card element...');
      
      // Generate canvas with minimal options to avoid CSS parsing
      const canvas = await html2canvas(tempContainer, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: false,
        allowTaint: true,
        logging: false,
        ignoreElements: (element: Element) => {
          // Skip elements that might cause issues
          return element.tagName === 'SCRIPT' || element.tagName === 'STYLE';
        },
      });

      // Remove temp container
      document.body.removeChild(tempContainer);

      console.log('Canvas created:', canvas.width, 'x', canvas.height);

      // Create PDF with 8 cards layout
      const imgData = canvas.toDataURL('image/png');
      console.log('Image data created, length:', imgData.length);
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      console.log('PDF document created');

      // A4 dimensions in mm
      const pdfWidth = 210; // A4 width in mm
      const pdfHeight = 297; // A4 height in mm
      
      // Grid layout: 4 columns x 2 rows = 8 cards
      const cols = 4;
      const rows = 2;
      const gap = 5; // 5mm gap between cards
      
      // Calculate card dimensions to fit 8 cards with gaps
      const availableWidth = pdfWidth - (gap * (cols + 1)); // Total width minus gaps
      const availableHeight = pdfHeight - (gap * (rows + 1)); // Total height minus gaps
      
      const cardWidth = availableWidth / cols;
      const cardHeight = availableHeight / rows;
      
      console.log('Card grid layout:', cols, 'x', rows, 'cards');
      console.log('Card size:', cardWidth, 'x', cardHeight, 'mm with', gap, 'mm gaps');
      
      // Add 8 cards in a 4x2 grid
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = gap + (col * (cardWidth + gap));
          const y = gap + (row * (cardHeight + gap));
          
          console.log(`Adding card ${row * cols + col + 1} at:`, x, y);
          pdf.addImage(imgData, 'PNG', x, y, cardWidth, cardHeight);
        }
      }
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `visitor-card-${visitorData.visitorId}-${timestamp}.pdf`;
      
      console.log('Saving PDF as:', filename);
      pdf.save(filename);
      
      console.log('PDF generated successfully!');
      alert('PDF downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to generate PDF: ${errorMessage}`);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const generatePDF = async () => {
    // Try alternative method first (dom-to-image)
    return generatePDFAlternative();
  };

  const generateBulkCards = async (formData: VisitorFormData) => {
    if (!formData.cardCount) {
      alert('Please enter the number of visitors');
      return;
    }

    const visitorCount = parseInt(formData.cardCount);
    if (isNaN(visitorCount) || visitorCount <= 0 || visitorCount > 10000) {
      alert('Please enter a valid number of visitors between 1 and 10000');
      return;
    }

    setIsBulkGenerating(true);
    
    try {
      const totalCards = formData.duplicateCards ? visitorCount * 2 : visitorCount;
      console.log(`Starting bulk generation for ${visitorCount} visitors (${totalCards} cards total)...`);
      
      // Save visitor cards as passes to database first
      try {
        console.log('Creating visitor passes in database...');
        
        // Create passes for each visitor
        const passesToCreate = [];
        // Extract starting number from form visitor ID (e.g., "VIS-1501" -> 1501)
        const startingNumber = parseInt((formData.visitorId || 'VIS-1').replace('VIS-', '')) || 1;
        console.log(`Starting visitor ID generation from: ${startingNumber}`);
        
        for (let i = 0; i < visitorCount; i++) {
          const visitorId = `VIS-${String(startingNumber + i).padStart(4, '0')}`;
          
          // Create one pass
          passesToCreate.push({
            passId: visitorId,
            eventId: `visitor-event-${Date.now()}`,
            status: 'unused',
            qrUrl: `${window.location.origin}/scan/${visitorId}`,
            // Don't store qrDataUrl to save space
            createdAt: new Date(),
            updatedAt: new Date(),
            type: formData.type,
            startDate: formData.startDate,
            endDate: formData.endDate,
            location: formData.location,
          });
          
          // If duplicates enabled, create second pass with same ID but different internal ID
          if (formData.duplicateCards) {
            passesToCreate.push({
              passId: `${visitorId}-DUP`,
              eventId: `visitor-event-${Date.now()}`,
              status: 'unused',
              qrUrl: `${window.location.origin}/scan/${visitorId}`, // Same QR as original
              createdAt: new Date(),
              updatedAt: new Date(),
              type: formData.type,
              startDate: formData.startDate,
              endDate: formData.endDate,
              location: formData.location,
              isDuplicate: true,
            });
          }
        }

        // Save directly to database
        const saveResponse = await fetch('/api/passes/save-visitor-cards', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            passes: passesToCreate,
          }),
        });

        if (saveResponse.ok) {
          const result = await saveResponse.json();
          console.log(`Successfully created ${result.count} visitor passes in database`);
        } else {
          console.log('Using fallback batch creation...');
          // Fallback to original batch creation
          const response = await fetch('/api/passes/create-batch', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              eventId: `visitor-event-${Date.now()}`,
              prefix: 'VIS',
              count: formData.duplicateCards ? visitorCount * 2 : visitorCount,
            }),
          });

          if (response.ok) {
            const result = await response.json();
            console.log(`Successfully created ${result.count} passes in database`);
          }
        }
      } catch (dbError) {
        console.error('Database save error:', dbError);
        alert('Failed to save passes to database. PDF generation will continue.');
      }
      
      // Create PDF with multiple cards
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const cardsPerPage = 9; // 3x3 grid per page
      const cardWidth = 70; // Width for 3 cards across A4 (210mm / 3)
      const cardHeight = 99; // Height for 3 cards down A4 (297mm / 3)
      const margin = 0; // No gaps between cards
      
      let cardIndex = 0;
      
      // Use same starting number as database generation
      const pdfStartingNumber = parseInt((formData.visitorId || 'VIS-1').replace('VIS-', '')) || 1;
      
      for (let i = 0; i < visitorCount; i++) {
        const visitorId = `VIS-${String(pdfStartingNumber + i).padStart(4, '0')}`;
        
        // Update visitor data for this card
        const currentCardData = {
          ...formData,
          visitorId,
        };
        
        // Generate cards (1 or 2 depending on duplicate setting)
        const cardsToGenerate = formData.duplicateCards ? 2 : 1;
        
        for (let duplicate = 0; duplicate < cardsToGenerate; duplicate++) {
          // Update the preview card data
          setVisitorData(currentCardData);
          
          // Wait for DOM to update
          await new Promise(resolve => setTimeout(resolve, 100));
          
          if (!cardRef.current) continue;

          try {
            // Generate image for this card
            const dataUrl = await domtoimage.toPng(cardRef.current, {
              quality: 1.0,
              bgcolor: '#ffffff',
              width: cardRef.current.offsetWidth,
              height: cardRef.current.offsetHeight,
            });

            // Calculate position on page
            const currentCardIndex = cardIndex % cardsPerPage;
            const pageIndex = Math.floor(cardIndex / cardsPerPage);
            
            // Add new page if needed
            if (cardIndex > 0 && currentCardIndex === 0) {
              pdf.addPage();
            }
            
            // Calculate x, y position for 3x3 grid (3 columns, 3 rows)
            const col = currentCardIndex % 3;
            const row = Math.floor(currentCardIndex / 3);
            const x = col * cardWidth; // No margin, cards touch each other
            const y = row * cardHeight; // No margin, cards touch each other

            pdf.addImage(dataUrl, 'PNG', x, y, cardWidth, cardHeight);
            
            const duplicateText = formData.duplicateCards ? ` (copy ${duplicate + 1})` : '';
            console.log(`Generated card ${cardIndex + 1}/${totalCards}: ${visitorId}${duplicateText}`);
            
            cardIndex++;
            
          } catch (error) {
            console.error(`Error generating card ${cardIndex + 1}:`, error);
          }
        }
        
        // Add cutting guides at the end of each page or when all cards are done
        if (cardIndex % cardsPerPage === 0 || cardIndex === totalCards) {
          // Add cutting guide lines (dashed lines)
          pdf.setLineDashPattern([2, 2], 0); // Dashed line pattern
          pdf.setLineWidth(0.2); // Thin lines
          pdf.setDrawColor(150, 150, 150); // Gray color
          
          // Vertical cutting lines
          for (let col = 1; col < 3; col++) {
            const lineX = col * cardWidth;
            pdf.line(lineX, 0, lineX, 297); // Full height line
          }
          
          // Horizontal cutting lines  
          for (let row = 1; row < 3; row++) {
            const lineY = row * cardHeight;
            pdf.line(0, lineY, 210, lineY); // Full width line
          }
          
          // Add cutting icons (scissors) at corners
          pdf.setFontSize(8);
          pdf.setTextColor(100, 100, 100);
          pdf.text('✂', 2, 8); // Top-left
          pdf.text('✂', 205, 8); // Top-right
          pdf.text('✂', 2, 292); // Bottom-left
          pdf.text('✂', 205, 292); // Bottom-right
          
          // Reset line style
          pdf.setLineDashPattern([], 0);
        }
      }

      // Save the PDF
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `bulk-visitor-cards-${visitorCount}-${formData.duplicateCards ? 'duplicates-' : ''}${timestamp}.pdf`;
      pdf.save(filename);
      
      const duplicateText = formData.duplicateCards ? ` (${totalCards} cards total - 2 per visitor)` : '';
      alert(`Successfully generated visitor cards for ${visitorCount} visitors${duplicateText}!\nPasses saved to database.`);
      console.log('Bulk generation completed');
      
      // Refresh the generated cards list
      loadGeneratedCards();
      
    } catch (error) {
      console.error('Bulk generation failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Bulk generation failed: ${errorMessage}`);
    } finally {
      setIsBulkGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Visitor Card Generator</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto py-6 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Visitor Information
                </CardTitle>
                <CardDescription>
                  Fill in the details to generate a visitor card
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="visitorId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Visitor ID
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="VIS-0001" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Visitor Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select visitor type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="VISITOR">Visitor</SelectItem>
                              <SelectItem value="CONTRACTOR">Contractor</SelectItem>
                              <SelectItem value="VENDOR">Vendor</SelectItem>
                              <SelectItem value="GUEST">Guest</SelectItem>
                              <SelectItem value="VIP">VIP</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              Start Date
                            </FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="endDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              End Date
                            </FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Location
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="Enter location (e.g., Main Building)" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Separator />

                    {/* Bulk Generation Section */}
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="bulkMode"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                Bulk Generation Mode
                              </FormLabel>
                              <div className="text-sm text-muted-foreground">
                                Generate multiple cards automatically with sequential IDs (9 cards per A4 page, no gaps)
                              </div>
                            </div>
                            <FormControl>
                              <input
                                type="checkbox"
                                checked={field.value || false}
                                onChange={field.onChange}
                                className="h-4 w-4"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      {form.watch('bulkMode') && (
                        <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                          <FormField
                            control={form.control}
                            name="cardCount"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center gap-2">
                                  <User className="h-4 w-4" />
                                  Number of Visitors
                                </FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    placeholder="Enter visitor count (e.g., 500 visitors)" 
                                    min="1"
                                    max="10000"
                                    {...field} 
                                  />
                                </FormControl>
                                <div className="text-xs text-muted-foreground">
                                  Enter the total number of visitors. One card will be generated per visitor.
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="duplicateCards"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-sm font-medium">
                                    Generate Duplicate Cards
                                  </FormLabel>
                                  <div className="text-xs text-muted-foreground">
                                    Create 2 identical cards per visitor (backup/spare cards)
                                  </div>
                                </div>
                                <FormControl>
                                  <input
                                    type="checkbox"
                                    checked={field.value || false}
                                    onChange={field.onChange}
                                    className="h-4 w-4"
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </div>

                    <Separator />

                    <div className="flex gap-3">
                      <Button 
                        type="submit" 
                        className="flex-1 gap-2"
                        disabled={isBulkGenerating}
                      >
                        {form.watch('bulkMode') ? (
                          <>
                            {isBulkGenerating ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <FileText className="h-4 w-4" />
                            )}
                            {isBulkGenerating ? 'Generating Visitor Cards...' : 'Generate Visitor Cards'}
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4" />
                            Update Preview
                          </>
                        )}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => form.reset()}
                        className="gap-2"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Reset
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Actions Card */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
                <CardDescription>
                  Generate and download your visitor card
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={generatePDF} 
                  disabled={isGeneratingPDF}
                  className="w-full gap-2"
                  size="lg"
                >
                  {isGeneratingPDF ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {isGeneratingPDF ? 'Generating PDF...' : 'Download as PDF'}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Preview Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Card Preview</CardTitle>
                <CardDescription>
                  Live preview of your visitor card
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <div ref={cardRef}>
                  <VisitorCard data={visitorData} scale={0.8} />
                </div>
              </CardContent>
            </Card>

            {/* Card Details */}
            <Card>
              <CardHeader>
                <CardTitle>Card Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Visitor ID:</span>
                  <span className="font-medium">{visitorData.visitorId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="font-medium">{visitorData.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="font-medium">
                    {visitorData.startDate ? new Date(visitorData.startDate).toLocaleDateString() : 'Not set'} - {visitorData.endDate ? new Date(visitorData.endDate).toLocaleDateString() : 'Not set'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Location:</span>
                  <span className="font-medium">{visitorData.location}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Generated Cards List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Recently Generated Cards</span>
                <Button
                  onClick={loadGeneratedCards}
                  variant="outline"
                  size="sm"
                  disabled={loadingCards}
                >
                  {loadingCards ? 'Loading...' : 'Refresh'}
                </Button>
              </CardTitle>
              <CardDescription>
                List of recently generated visitor cards
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingCards ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-sm text-muted-foreground">Loading cards...</div>
                </div>
              ) : generatedCards.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-sm text-muted-foreground">No cards generated yet</div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3 font-medium">Pass ID</th>
                        <th className="text-left py-2 px-3 font-medium">Status</th>
                        <th className="text-left py-2 px-3 font-medium">Type</th>
                        <th className="text-left py-2 px-3 font-medium">Created</th>
                        <th className="text-left py-2 px-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {generatedCards.map((card, index) => (
                        <tr key={index} className="border-b hover:bg-muted/50">
                          <td className="py-2 px-3">
                            <span className="font-mono text-sm">{card.passId}</span>
                            {card.isDuplicate && (
                              <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-1 rounded">
                                DUP
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              card.status === 'used' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {card.status}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-sm text-muted-foreground">
                            {card.isDuplicate ? 'Duplicate' : 'Original'}
                          </td>
                          <td className="py-2 px-3 text-sm text-muted-foreground">
                            {new Date(card.createdAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td className="py-2 px-3">
                            <Button
                              onClick={() => {
                                const cleanPassId = card.passId.replace('-DUP', '');
                                setVisitorData(prev => ({ ...prev, visitorId: cleanPassId }));
                                form.setValue('visitorId', cleanPassId);
                              }}
                              variant="ghost"
                              size="sm"
                              className="text-xs"
                            >
                              Use
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
