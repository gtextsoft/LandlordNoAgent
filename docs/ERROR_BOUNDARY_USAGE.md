# Standardized Error Boundaries Usage Guide

## Overview

This document provides guidelines for implementing standardized error boundaries throughout the LandlordNoAgent application. Error boundaries are React components that catch JavaScript errors anywhere in their child component tree, log those errors, and display a fallback UI instead of crashing the entire application.

## Why Use Error Boundaries?

1. **Prevent Application Crashes**: Isolate errors to specific components rather than crashing the entire application
2. **Improve User Experience**: Show helpful fallback UIs when errors occur
3. **Better Error Reporting**: Capture and log errors consistently
4. **Easier Debugging**: Identify which component caused the error

## Available Error Boundary Components

### 1. ErrorBoundaryWrapper

The base error boundary component that provides error catching and fallback UI functionality.

```tsx
import ErrorBoundaryWrapper from '@/components/ErrorBoundaryWrapper';

<ErrorBoundaryWrapper componentName="MyComponent">
  <MyComponent />
</ErrorBoundaryWrapper>
```

### 2. SectionErrorBoundary

A convenient component for wrapping sections of your application with error boundaries.

```tsx
import { SectionErrorBoundary } from '@/utils/errorBoundaryUtils';

<SectionErrorBoundary name="DataTable">
  <DataTable data={data} />
</SectionErrorBoundary>
```

### 3. withErrorBoundary HOC

A higher-order component for wrapping entire components with error boundaries.

```tsx
import { withErrorBoundary } from '@/utils/errorBoundaryUtils';

const MyComponent = () => {
  // Component implementation
};

export default withErrorBoundary(MyComponent, {
  componentName: 'MyComponent'
});
```

## Implementation Guidelines

### When to Use Error Boundaries

1. **Top-Level Routes**: Always wrap page components with error boundaries
2. **Data-Fetching Components**: Wrap components that fetch and display data
3. **Complex UI Components**: Wrap components with complex state or calculations
4. **Third-Party Components**: Wrap third-party components that might throw errors

### Best Practices

1. **Provide Component Names**: Always include a descriptive `componentName` prop to make debugging easier
2. **Custom Fallback UIs**: Create context-appropriate fallback UIs for different parts of the application
3. **Error Logging**: Use the `errorHandler` prop to log errors to your monitoring service
4. **Granular Boundaries**: Use multiple error boundaries to prevent a single error from affecting unrelated parts of the UI

## Examples

### Basic Usage

```tsx
import { SectionErrorBoundary } from '@/utils/errorBoundaryUtils';

function Dashboard() {
  return (
    <div className="dashboard">
      <SectionErrorBoundary name="DashboardHeader">
        <DashboardHeader />
      </SectionErrorBoundary>
      
      <SectionErrorBoundary name="DashboardContent">
        <DashboardContent />
      </SectionErrorBoundary>
      
      <SectionErrorBoundary name="DashboardFooter">
        <DashboardFooter />
      </SectionErrorBoundary>
    </div>
  );
}
```

### Custom Fallback UI

```tsx
import { SectionErrorBoundary } from '@/utils/errorBoundaryUtils';
import { Button } from '@/components/ui/button';

function PropertyList() {
  return (
    <SectionErrorBoundary 
      name="PropertyList"
      fallbackUI={
        <div className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-4">Unable to load properties</h2>
          <p className="mb-4">We're having trouble loading the properties. Please try again later.</p>
          <Button onClick={() => window.location.reload()}>Reload Page</Button>
        </div>
      }
    >
      <Properties />
    </SectionErrorBoundary>
  );
}
```

### Custom Error Handler

```tsx
import { withErrorBoundary } from '@/utils/errorBoundaryUtils';
import { captureException } from '@/utils/errorReporting';

const PaymentForm = () => {
  // Component implementation
};

export default withErrorBoundary(PaymentForm, {
  componentName: 'PaymentForm',
  errorHandler: (error, errorInfo) => {
    // Log to console
    console.error('Payment form error:', error);
    
    // Send to error reporting service
    captureException(error, {
      component: 'PaymentForm',
      errorInfo,
      additionalData: {
        // Add any relevant context
        page: 'payment',
        feature: 'checkout'
      }
    });
  }
});
```

## Migration Guide

To migrate existing components to use the standardized error boundaries:

1. Identify components that should have error boundaries (pages, data-fetching components, etc.)
2. Choose the appropriate error boundary approach (wrapper, HOC, or section)
3. Add the error boundary with a descriptive component name
4. Add custom fallback UIs where appropriate
5. Add custom error handlers where needed

## Testing Error Boundaries

To test that your error boundaries are working correctly:

```tsx
// In your component
const BuggyComponent = () => {
  throw new Error('Test error');
  return <div>This will never render</div>;
};

// In your page
<SectionErrorBoundary name="TestBoundary">
  <BuggyComponent />
</SectionErrorBoundary>
```

This should display the fallback UI instead of crashing the application.