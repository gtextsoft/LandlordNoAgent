import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SectionErrorBoundary } from '@/utils/errorBoundaryUtils';

/**
 * This component demonstrates how to use error boundaries in a real-world scenario.
 * It includes buttons that trigger different types of errors to show how the error boundaries work.
 */
const ErrorBoundaryExample = () => {
  return (
    <div className="container mx-auto p-4 space-y-8">
      <h1 className="text-2xl font-bold">Error Boundary Examples</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Example 1: Component with error boundary */}
        <SectionErrorBoundary name="Counter">
          <ErrorProneCounter />
        </SectionErrorBoundary>
        
        {/* Example 2: Component with custom fallback UI */}
        <SectionErrorBoundary 
          name="DataFetcher"
          fallbackUI={
            <Card>
              <CardHeader>
                <CardTitle>Data Fetching Error</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4">We couldn't load the data. Please try again.</p>
                <Button onClick={() => window.location.reload()}>Retry</Button>
              </CardContent>
            </Card>
          }
        >
          <ErrorProneDataFetcher />
        </SectionErrorBoundary>
      </div>
    </div>
  );
};

/**
 * A counter component that will throw an error when the count exceeds 5.
 */
const ErrorProneCounter = () => {
  const [count, setCount] = useState(0);
  
  const incrementCount = () => {
    setCount(prevCount => prevCount + 1);
  };
  
  // This will cause an error when count > 5
  if (count > 5) {
    throw new Error('Count exceeded maximum value!');
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Error Prone Counter</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p>Current count: {count}</p>
        <p className="text-sm text-gray-500">
          This component will throw an error when the count exceeds 5.
        </p>
        <Button onClick={incrementCount}>Increment Count</Button>
      </CardContent>
    </Card>
  );
};

/**
 * A component that simulates a data fetching error.
 */
const ErrorProneDataFetcher = () => {
  const [shouldError, setShouldError] = useState(false);
  
  const triggerError = () => {
    setShouldError(true);
  };
  
  if (shouldError) {
    throw new Error('Failed to fetch data!');
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Fetcher</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p>Click the button to simulate a data fetching error.</p>
        <Button onClick={triggerError} variant="destructive">
          Simulate Fetch Error
        </Button>
      </CardContent>
    </Card>
  );
};

export default ErrorBoundaryExample;