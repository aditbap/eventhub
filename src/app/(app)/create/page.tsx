
'use client';

import { useState, type ChangeEvent, type FormEvent } from 'react';
import type { Event, Attendee } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, UploadCloud, DollarSign, MapPin, Building, Clock, FileText, Palette, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { eventStore } from '@/lib/eventStore';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import * as z from 'zod';
import { cn } from '@/lib/utils';

const createEventFormSchema = z.object({
  title: z.string().min(3, { message: 'Event title must be at least 3 characters.' }).max(100),
  description: z.string().min(10, { message: 'Description must be at least 10 characters.' }).max(1000),
  date: z.date({ required_error: 'Event date is required.' }),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Invalid time format. Use HH:MM (24-hour).' }),
  location: z.string().min(3, { message: 'Location is required.' }).max(100),
  venue: z.string().optional().default(''),
  category: z.enum(['Music', 'Food', 'Sports', 'Tech', 'Other'], { required_error: 'Category is required.' }),
  price: z.preprocess(
    (val) => (val === "" || val === undefined || val === null) ? undefined : Number(val),
    z.number().min(0, { message: 'Price cannot be negative.' }).optional()
  ),
  imageUrl: z.string().optional().default('https://placehold.co/1200x600.png'),
  imageHint: z.string().optional().default('event image'),
});

type CreateEventFormValues = z.infer<typeof createEventFormSchema>;

const MOCK_ATTENDEES: Attendee[] = [
    { id: 'att1', name: 'User A', avatarUrl: 'https://placehold.co/32x32.png?text=A' },
    { id: 'att2', name: 'User B', avatarUrl: 'https://placehold.co/32x32.png?text=B' },
];

export default function CreateEventPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { register, handleSubmit, control, formState: { errors, isSubmitting }, reset, setValue } = useForm<CreateEventFormValues>({
    resolver: zodResolver(createEventFormSchema),
    defaultValues: {
      title: '',
      description: '',
      date: undefined,
      time: '',
      location: '',
      venue: '',
      category: undefined,
      price: undefined,
      imageUrl: 'https://placehold.co/1200x600.png',
      imageHint: 'event image',
    },
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        setValue('imageUrl', result); 
      };
      reader.readAsDataURL(file);
    } else {
      setSelectedFile(null);
      setImagePreview(null);
      setValue('imageUrl', 'https://placehold.co/1200x600.png');
    }
  };

  async function onSubmit(data: CreateEventFormValues) {
    const newEvent: Event = {
      id: Date.now().toString(),
      title: data.title,
      description: data.description,
      date: format(data.date, 'yyyy-MM-dd'),
      time: data.time,
      location: data.location,
      venue: data.venue || undefined,
      category: data.category,
      price: data.price ?? 0,
      imageUrl: data.imageUrl,
      imageHint: data.imageHint,
      attendees: MOCK_ATTENDEES,
      attendanceCount: MOCK_ATTENDEES.length,
      isBookmarked: false,
    };

    eventStore.addEvent(newEvent);

    toast({
      title: '🎉 Event Created!',
      description: `${data.title} has been successfully created and added to Explore.`,
    });
    reset(); 
    setImagePreview(null); 
    setSelectedFile(null);
    // router.push('/explore'); // Optional: redirect after creation
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-background/80 backdrop-blur-md border-b w-full">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-foreground hover:bg-muted/20 rounded-full">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-headline font-semibold text-foreground">Create New Event</h1>
        <div className="w-9 h-9"></div>
      </header>

      <div className="container mx-auto max-w-2xl p-4 sm:p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          
          <div className="space-y-2">
            <Label htmlFor="title" className="flex items-center text-base font-semibold">
              <FileText className="mr-2 h-5 w-5 text-primary" /> Event Title
            </Label>
            <Input id="title" {...register('title')} placeholder="e.g., Annual Summer Fest" className={cn(errors.title && "border-destructive")} />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="flex items-center text-base font-semibold">
              <FileText className="mr-2 h-5 w-5 text-primary opacity-70" /> Description
            </Label>
            <Textarea id="description" {...register('description')} placeholder="Tell us more about your event..." rows={5} className={cn(errors.description && "border-destructive")}/>
            {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
               <Label htmlFor="date" className="flex items-center text-base font-semibold">
                 <CalendarIcon className="mr-2 h-5 w-5 text-primary" /> Date
               </Label>
               <Controller
                  name="date"
                  control={control}
                  render={({ field }) => (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal h-11",
                            !field.value && "text-muted-foreground",
                            errors.date && "border-destructive"
                          )}
                        >
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() -1)) }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                />
              {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="time" className="flex items-center text-base font-semibold">
                <Clock className="mr-2 h-5 w-5 text-primary" /> Time
              </Label>
              <Input id="time" type="time" {...register('time')} className={cn("h-11", errors.time && "border-destructive")} />
              {errors.time && <p className="text-sm text-destructive">{errors.time.message}</p>}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center text-base font-semibold">
                <MapPin className="mr-2 h-5 w-5 text-primary" /> Location
              </Label>
              <Input id="location" {...register('location')} placeholder="e.g., Main Campus Green" className={cn(errors.location && "border-destructive")} />
              {errors.location && <p className="text-sm text-destructive">{errors.location.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="venue" className="flex items-center text-base font-semibold">
                <Building className="mr-2 h-5 w-5 text-primary opacity-70" /> Venue <span className="text-xs text-muted-foreground ml-1">(Optional)</span>
              </Label>
              <Input id="venue" {...register('venue')} placeholder="e.g., Auditorium A" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
               <Label htmlFor="category" className="flex items-center text-base font-semibold">
                 <Palette className="mr-2 h-5 w-5 text-primary" /> Category
               </Label>
               <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <SelectTrigger className={cn("h-11", errors.category && "border-destructive")}>
                        <SelectValue placeholder="Select event category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Music">Music</SelectItem>
                        <SelectItem value="Food">Food</SelectItem>
                        <SelectItem value="Sports">Sports</SelectItem>
                        <SelectItem value="Tech">Tech</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="price" className="flex items-center text-base font-semibold">
                <DollarSign className="mr-2 h-5 w-5 text-primary opacity-70" /> Price <span className="text-xs text-muted-foreground ml-1">(0 for free)</span>
              </Label>
              <Input id="price" type="number" {...register('price')} placeholder="e.g., 10 or leave blank for free" step="0.01" min="0" className={cn(errors.price && "border-destructive")} />
              {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="eventImageFile" className="flex items-center text-base font-semibold">
              <UploadCloud className="mr-2 h-5 w-5 text-primary" /> Event Image
            </Label>
            <div className={cn(
                "mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md",
                errors.imageUrl ? "border-destructive" : "border-input hover:border-primary/70"
              )}
            >
              <div className="space-y-1 text-center">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="mx-auto h-32 w-auto rounded-md object-contain" data-ai-hint="event preview"/>
                ) : (
                  <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                )}
                <div className="flex text-sm text-muted-foreground justify-center">
                  <label
                    htmlFor="eventImageFile"
                    className="relative cursor-pointer rounded-md font-medium text-primary hover:text-primary/80 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-ring"
                  >
                    <span>{selectedFile ? 'Change file' : 'Upload a file'}</span>
                    <input id="eventImageFile" name="eventImageFile" type="file" className="sr-only" accept="image/png, image/jpeg, image/gif" onChange={handleFileChange} />
                  </label>
                  {!selectedFile && <p className="pl-1">or drag and drop</p>}
                </div>
                {!selectedFile && <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 10MB</p>}
                {selectedFile && <p className="text-xs text-muted-foreground truncate max-w-xs mx-auto">{selectedFile.name}</p>}
              </div>
            </div>
            {errors.imageUrl && <p className="text-sm text-destructive">{errors.imageUrl.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageHint" className="flex items-center text-base font-semibold">
              <FileText className="mr-2 h-5 w-5 text-primary opacity-70" /> Image AI Hint <span className="text-xs text-muted-foreground ml-1">(Optional, 1-2 words)</span>
            </Label>
            <Input id="imageHint" {...register('imageHint')} placeholder="e.g., concert lights" maxLength={30}/>
            {errors.imageHint && <p className="text-sm text-destructive">{errors.imageHint.message}</p>}
          </div>

          <Button type="submit" size="lg" className="w-full mt-6 h-12 text-base" disabled={isSubmitting}>
            {isSubmitting ? 'Creating Event...' : 'Create Event'}
          </Button>
        </form>
      </div>
    </div>
  );
}

