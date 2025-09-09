import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  const supabase = getSupabaseBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { 
      name, 
      description, 
      target_amount_kobo, 
      frequency, 
      contribution_amount, 
      privacy,
      members = [] 
    } = body;

    // Start a transaction
    const { data: group, error: groupError } = await supabase
      .from('savings_groups')
      .insert({
        name,
        description,
        created_by: user.id,
        target_amount_kobo,
        contribution_amount,
        frequency,
        privacy: privacy || 'private',
        next_contribution_date: new Date().toISOString()
      })
      .select()
      .single();

    if (groupError) throw groupError;

    // Add creator as admin member
    const memberInserts = [
      { group_id: group.id, user_id: user.id, is_admin: true }
    ];

    // Add other members if provided and group is not private
    if (privacy === 'public' && members && Array.isArray(members)) {
      members.forEach((memberId: string) => {
        if (memberId !== user.id) {
          memberInserts.push({
            group_id: group.id,
            user_id: memberId,
            is_admin: false
          });
        }
      });
    }

    // Insert all members
    const { error: memberError } = await supabase
      .from('savings_group_members')
      .insert(memberInserts);

    if (memberError) throw memberError;

    return NextResponse.json({ group });
  } catch (error) {
    console.error('Error creating group:', error);
    return NextResponse.json(
      { error: 'Failed to create group' },
      { status: 500 }
    );
  }
}

export async function GET() {
  const supabase = getSupabaseBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }

  try {
    // Get groups where user is a member
    const { data: groups, error } = await supabase
      .from('savings_group_members')
      .select(`
        is_admin,
        joined_at,
        groups:group_id (
          id,
          name,
          description,
          target_amount_kobo,
          frequency,
          next_contribution_date,
          created_at,
          created_by,
          creator:created_by(username, full_name, avatar_url)
        ),
        members:group_id (
          id,
          user_id,
          is_admin
        )
      `)
      .eq('user_id', user.id);

    if (error) throw error;

    interface GroupWithMembers {
      groups: {
        id: string;
        name: string;
        description: string | null;
        target_amount_kobo: number | null;
        frequency: string | null;
        next_contribution_date: string | null;
        created_at: string;
        created_by: string;
        creator: {
          username: string;
          full_name: string | null;
          avatar_url: string | null;
        };
      };
      members: Array<{
        id: string;
        user_id: string;
        is_admin: boolean;
      }>;
    }

    // Map the groups data to the expected format
    const formattedGroups = groups.map((group: any) => ({
      id: group.groups?.id,
      name: group.groups?.name,
      description: group.groups?.description || null,
      target_amount_kobo: group.groups?.target_amount_kobo || null,
      frequency: group.groups?.frequency || null,
      next_contribution_date: group.groups?.next_contribution_date || null,
      created_at: group.groups?.created_at,
      created_by: group.groups?.created_by,
      creator: group.groups?.creator?.[0] || null,
      is_admin: group.members?.some((member: any) => 
        member.user_id === user?.id && member.is_admin
      ) || false
    }));

    return NextResponse.json(formattedGroups);
  } catch (error) {
    console.error('Error fetching groups:', error);
    return NextResponse.json(
      { error: 'Failed to fetch groups' },
      { status: 500 }
    );
  }
}
