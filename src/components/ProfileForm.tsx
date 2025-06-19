
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, type Profile } from "@/hooks/useAuth";
import { useState } from "react";
import AvatarUpload from "@/components/AvatarUpload";

const profileFormSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters.").max(50, "Name cannot exceed 50 characters."),
  avatar_url: z.string().url("Invalid URL format.").nullable(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface ProfileFormProps {
  userProfile: Profile;
}

export const ProfileForm = ({ userProfile }: ProfileFormProps) => {
  const { toast } = useToast();
  const { user, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      full_name: userProfile.full_name || "",
      avatar_url: userProfile.avatar_url || null,
    },
    mode: 'onChange'
  });

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: data.full_name,
          avatar_url: data.avatar_url,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
      await refreshProfile();
    } catch (error: any) {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleAvatarUploaded = (url: string) => {
    form.setValue('avatar_url', url, { shouldValidate: true, shouldDirty: true });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="avatar_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Avatar</FormLabel>
              <FormControl>
                <AvatarUpload
                  currentAvatarUrl={field.value}
                  onAvatarUploaded={handleAvatarUploaded}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="full_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="Your full name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={loading || !form.formState.isDirty}>
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </Form>
  );
};
