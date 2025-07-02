import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Settings } from 'lucide-react';

export default function SystemSettings() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">System Settings</h2>
          <p className="text-muted-foreground">
            Platform configuration and settings
          </p>
        </div>
        <Settings className="h-6 w-6 text-muted-foreground" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Platform Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              System settings and configuration options will be available in an upcoming update.
              This will include email settings, notification preferences, and platform customization options.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
} 