import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

export default function SuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div className="flex justify-center">
          <CheckCircle className="h-24 w-24 text-green-500/80" strokeWidth={1} />
        </div>
        
        <div className="space-y-4">
          <h1 className="font-serif text-4xl text-foreground">
            Payment Successful
          </h1>
          <p className="text-muted-foreground text-lg">
            Welcome to Elevated Living. Your order has been securely processed and is now being prepared.
          </p>
        </div>

        <div className="pt-8">
          <Link href="/">
            <Button className="w-full h-12 text-sm font-medium tracking-wide" size="lg">
              Return to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
