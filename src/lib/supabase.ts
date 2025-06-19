import { supabase as client } from '@/integrations/supabase/client';

export const supabase = client;

// Type definitions - kept for backwards compatibility with read-only files
export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  role: 'renter' | 'landlord' | 'admin';
  roles?: ('admin' | 'landlord' | 'renter')[];
  created_at: string;
  updated_at: string;
  avatar_url?: string;
}

export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  location?: string;
  photo_url?: string;
  photo_urls?: string[];
  status: string;
  landlord_id: string;
  bedrooms?: number;
  bathrooms?: number;
  amenities?: string[];
  created_at: string;
  updated_at: string;
  profiles?: Profile;
}

export interface ChatRoom {
  id: string;
  property_id: string;
  renter_id: string;
  landlord_id: string;
  created_at: string;
  properties?: Property;
  renter_profile?: Profile;
  landlord_profile?: Profile;
}

export interface Message {
  id: string;
  chat_room_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  profiles?: Profile;
  sender?: Profile;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'landlord' | 'renter';
  created_at: string;
}

export type UserRoleType = 'renter' | 'landlord' | 'admin';

// Helper function to check if user has a specific role
export const hasRole = (userRoles: string[] | undefined, role: string): boolean => {
  return userRoles?.includes(role) || false;
};

// Helper function to get primary role for navigation
export const getPrimaryRole = (userRoles: string[] | undefined): UserRoleType => {
  if (!userRoles || userRoles.length === 0) return 'renter';
  
  // Priority: admin > landlord > renter
  if (userRoles.includes('admin')) return 'admin';
  if (userRoles.includes('landlord')) return 'landlord';
  return 'renter';
};
