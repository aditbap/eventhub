
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon, DollarSign, ImageUp, Loader2, PlusSquare, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import type { Event } from '@/types'; // Assuming your Event type is defined

const eventCategories: Event['category'][] = ['Music', 'Food', 'Sports', 'Tech', 'Other'];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const createEventFormSchema = z.object({
  title: z.string().min(3, { message: 'Event title must be at least 3 characters.' }).max(100, { message: 'Event title must be at most 100 characters.' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters.' }).max(1000, { message: 'Description must be at most 1000 characters.' }),
  date: z.date({ required_error: 'Event date is required.' }),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Invalid time format. Use HH:MM (24-hour).' }),
  location: z.string().min(3, { message: 'Location is required.' }).max(150, { message: 'Location must be at most 150 characters.' }),
  venue: z.string().max(100, { message: 'Venue must be at most 100 characters.' }).optional().or(z.literal('')),
  category: z.enum(eventCategories, { required_error: 'Category is required.' }),
  price: z.coerce.number().min(0, { message: 'Price cannot be negative.' }).optional().default(0),
  imageUrl: z.any()
    // .refine((file) => !!file, "Event image is required.") // Optional for now
    .refine((file) => !file || file.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
    .refine((file) => !file || ACCEPTED_IMAGE_TYPES.includes(file.type), ".jpg, .jpeg, .png and .webp files are accepted.")
    .optional(),
});

type CreateEventFormValues = z.infer<typeof createEventFormSchema>;

export default function CreateEventPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const form = useForm<CreateEventFormValues>({
    resolver: zodResolver(createEventFormSchema),
    defaultValues: {
      title: '',
      description: '',
      date: undefined,
      time: '',
      location: '',
      venue: '',
      category: undefined,
      price: 0,
      imageUrl: undefined,
    },
  });

  async function onSubmit(data: CreateEventFormValues) {
    setIsLoading(true);
    console.log('Form submitted:', data);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    toast({
      title: '🎉 Event Created!',
      description: `${data.title} has been successfully scheduled.`,
      action: <Sparkles className="h-5 w-5 text-green-500" />,
    });
    form.reset();
    setImagePreview(null);
    setIsLoading(false);
  }

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue('imageUrl', file); // Set file object for validation
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      form.setValue('imageUrl', undefined);
      setImagePreview(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="flex items-center mb-6">
        <PlusSquare className="h-10 w-10 mr-3 text-primary" />
        <h1 className="text-3xl font-headline font-bold">Create New Event</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Event Title</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Summer Music Festival" {...field} />
                </FormControl>
                <FormDescription>
                  A catchy and descriptive title for your event.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Tell us more about your event..."
                    className="resize-y min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid md:grid-cols-2 gap-8">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date < new Date(new Date().setHours(0,0,0,0)) // Disable past dates
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Time (24-hour format)</FormLabel>
                  <FormControl>
                    <Input type="time" placeholder="HH:MM" {...field} />
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
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Central Park Bintaro" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="venue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Venue (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Main Stage" {...field} />
                </FormControl>
                 <FormDescription>
                  Specific hall, room, or area within the location.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />


          <div className="grid md:grid-cols-2 gap-8">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select event category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {eventCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price (USD)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input type="number" placeholder="0.00 (0 for free)" {...field} className="pl-8" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="imageUrl"
            render={({ field: { onChange, value, ...restField } }) => (
              <FormItem>
                <FormLabel>Event Image</FormLabel>
                <FormControl>
                  <Input 
                    type="file" 
                    accept="image/png, image/jpeg, image/webp" 
                    onChange={handleImageChange}
                    className="block w-full text-sm text-slate-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-sm file:font-semibold
                      file:bg-primary/10 file:text-primary
                      hover:file:bg-primary/20"
                    {...restField}
                  />
                </FormControl>
                {imagePreview && (
                  <div className="mt-4 relative w-full aspect-video max-w-sm rounded-md overflow-hidden border border-muted">
                    <img src={imagePreview} alt="Event preview" className="object-cover w-full h-full" data-ai-hint="event banner preview"/>
                  </div>
                )}
                <FormDescription>
                  Upload an image for your event (max 5MB, JPG/PNG/WEBP).
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <PlusSquare className="mr-2 h-5 w-5" />
            )}
            {isLoading ? 'Creating Event...' : 'Create Event'}
          </Button>
        </form>
      </Form>
    </div>
  );
}

    