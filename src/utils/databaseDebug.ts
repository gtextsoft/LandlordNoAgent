import { supabase } from '@/lib/supabase';

// Debug function to check database state
export const debugDatabase = async () => {
  try {
    console.log('🔍 Debugging database state...');
    
    // Check current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error('❌ Auth error:', userError);
      return;
    }
    
    console.log('👤 Current user:', user?.id);
    
    // Check user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user?.id)
      .single();
      
    if (profileError) {
      console.error('❌ Profile error:', profileError);
      return;
    }
    
    console.log('📋 User profile:', profile);
    
    // Check properties
    const { data: properties, error: propError } = await supabase
      .from('properties')
      .select('*')
      .eq('landlord_id', user?.id);
      
    if (propError) {
      console.error('❌ Properties error:', propError);
    } else {
      console.log('🏠 User properties:', properties);
    }
    
    // Check all properties in database (for debugging)
    const { data: allProperties, error: allPropError } = await supabase
      .from('properties')
      .select('*, profiles(*)');
      
    if (allPropError) {
      console.error('❌ All properties error:', allPropError);
    } else {
      console.log('🏠 All properties in database:', allProperties);
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
};

// Function to create sample data for testing
export const createSampleData = async () => {
  try {
    console.log('🎯 Creating sample data...');
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('❌ User not authenticated:', userError);
      return;
    }

    // Make sure user has landlord role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('❌ Profile not found:', profileError);
      return;
    }

    if (profile.role !== 'landlord') {
      console.log('⚠️ Updating user role to landlord...');
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'landlord' })
        .eq('id', user.id);
        
      if (updateError) {
        console.error('❌ Failed to update role:', updateError);
        return;
      }
    }

    // Create sample properties
    const sampleProperties = [
      {
        title: '3 Bedroom Apartment in Lekki',
        description: 'Beautiful modern apartment with all amenities, close to shopping centers and good road networks.',
        price: 500000,
        location: 'Lekki Phase 1, Lagos',
        photo_url: '/placeholder.svg',
        status: 'active',
        landlord_id: user.id
      },
      {
        title: 'Modern 2BR in Victoria Island',
        description: 'Luxury apartment in the heart of Victoria Island with ocean views and premium finishes.',
        price: 750000,
        location: 'Victoria Island, Lagos',
        photo_url: '/placeholder.svg',
        status: 'active',
        landlord_id: user.id
      },
      {
        title: 'Executive 4BR Duplex in Ikeja',
        description: 'Spacious duplex perfect for families, with compound parking and 24/7 security.',
        price: 800000,
        location: 'Ikeja GRA, Lagos',
        photo_url: '/placeholder.svg',
        status: 'active',
        landlord_id: user.id
      }
    ];

    for (const property of sampleProperties) {
      const { data, error } = await supabase
        .from('properties')
        .insert(property)
        .select()
        .single();
        
      if (error) {
        console.error('❌ Failed to create property:', error);
      } else {
        console.log('✅ Created property:', data.title);
      }
    }
    
    console.log('🎉 Sample data creation completed!');
    
  } catch (error) {
    console.error('❌ Sample data creation error:', error);
  }
};

// Function to clear sample data
export const clearSampleData = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('landlord_id', user.id);
      
    if (error) {
      console.error('❌ Failed to clear data:', error);
    } else {
      console.log('🧹 Sample data cleared');
    }
  } catch (error) {
    console.error('❌ Clear data error:', error);
  }
}; 