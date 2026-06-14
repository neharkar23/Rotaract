import { supabase } from './src/config/supabase.js';

const initialUsers = [
  {
    email: 'admin@rotaract.org',
    password: 'password123',
    name: 'Aarav Mehta',
    rotaract_id: 'RID-9901',
    club_id: 'CID-505',
    club_name: 'Rotaract Club of Midtown',
    parent_rotary: 'Rotary Club of Midtown Metro',
    district: 'RID 3141',
    role: 'ADMIN',
    status: 'APPROVED'
  },
  {
    email: 'treasurer@rotaract.org',
    password: 'password123',
    name: 'Siddharth Sen',
    rotaract_id: 'RID-8802',
    club_id: 'CID-505',
    club_name: 'Rotaract Club of Midtown',
    parent_rotary: 'Rotary Club of Midtown Metro',
    district: 'RID 3141',
    role: 'TREASURER',
    status: 'APPROVED'
  },
  {
    email: 'member@rotaract.org',
    password: 'password123',
    name: 'Riya Sharma',
    rotaract_id: 'RID-7703',
    club_id: 'CID-505',
    club_name: 'Rotaract Club of Midtown',
    parent_rotary: 'Rotary Club of Midtown Metro',
    district: 'RID 3141',
    role: 'MEMBER',
    status: 'APPROVED'
  }
];

const seedData = async () => {
  console.log('Starting seed process...');

  for (const user of initialUsers) {
    console.log(`Processing user: ${user.email}`);

    let userId = null;

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: {
        name: user.name,
        rotaract_id: user.rotaract_id,
        club_id: user.club_id,
        club_name: user.club_name,
        parent_rotary: user.parent_rotary,
        district: user.district
      }
    });

    if (authError) {
      if (authError.message.includes('already been registered')) {
        console.log(`- ${user.email} already exists in auth.`);
        // Fetch existing user to get ID
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
        if (users) {
          const existingUser = users.find(u => u.email === user.email);
          if (existingUser) userId = existingUser.id;
        }
      } else {
        console.error(`- Error creating auth for ${user.email}:`, authError.message);
        continue;
      }
    } else {
      userId = authData.user.id;
      console.log(`- Auth created for ${user.email} (ID: ${userId})`);
    }

    if (userId) {
      // Upsert profile in hr_profiles
      const { error: profileError } = await supabase.from('hr_profiles').upsert({
        id: userId,
        name: user.name,
        rotaract_id: user.rotaract_id,
        club_id: user.club_id,
        club_name: user.club_name,
        parent_rotary: user.parent_rotary,
        district: user.district,
        role: user.role,
        status: user.status
      });

      if (profileError) {
        console.error(`- Error updating profile for ${user.email}:`, profileError.message);
      } else {
        console.log(`- Profile created/updated for ${user.email}`);
      }
    }
  }

  // --- Add dummy data for Pie Charts ---
  console.log('Seeding analytics data...');
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const member = users?.find(u => u.email === 'member@rotaract.org');
  const admin = users?.find(u => u.email === 'admin@rotaract.org');

  if (member && admin) {
    // 1. Insert Past Events
    const pastDate1 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const pastDate2 = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const pastDate3 = new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString();

    const { data: events, error: eventErr } = await supabase.from('hr_events').insert([
      { title: 'Installation Ceremony 2026', start_time: pastDate1, venue: 'Grand Hotel', tag: 'Ceremony', created_by: admin.id },
      { title: 'Beach Cleanup Drive', start_time: pastDate2, venue: 'Juhu Beach', tag: 'Community Service', created_by: admin.id },
      { title: 'Resume Building Workshop', start_time: pastDate3, venue: 'College Auditorium', tag: 'Professional Dev', created_by: admin.id }
    ]).select();

    if (eventErr) console.error('Error inserting events:', eventErr.message);
    else {
      // 2. Insert Attendance
      const attendanceData = events.map(e => ({
        event_id: e.id,
        profile_id: member.id,
        attended_by_admin_id: admin.id
      }));
      
      const { error: attErr } = await supabase.from('hr_attendance').insert(attendanceData);
      if (attErr) console.error('Error inserting attendance:', attErr.message);
      else console.log('- Event attendance populated for chart.');
    }

    // 3. Insert Tasks
    const { error: taskErr } = await supabase.from('hr_tasks').insert([
      { title: 'Pay Dues', description: 'Upload UPI screenshot.', assigned_to: member.id, created_by: admin.id, status: 'COMPLETED' },
      { title: 'Volunteer Registration', description: 'Register for the next drive.', assigned_to: member.id, created_by: admin.id, status: 'PENDING' },
      { title: 'Submit Report', description: 'Submit the quarterly activity report.', assigned_to: member.id, created_by: admin.id, status: 'COMPLETED' },
      { title: 'Design Posters', description: 'Design social media posters.', assigned_to: member.id, created_by: admin.id, status: 'IN_PROGRESS' }
    ]);
    
    if (taskErr) console.error('Error inserting tasks:', taskErr.message);
    else console.log('- Tasks populated for chart.');
  }

  console.log('Seed process finished!');
};

seedData();
