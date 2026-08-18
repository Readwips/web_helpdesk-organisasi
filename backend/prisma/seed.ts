import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ─── Helper Functions ──────────────────────────────────────────────────────────

const random = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const randomInt = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const randomDate = (start: Date, end: Date): Date => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

const getSlaTarget = (priority: string): number => {
  const map: Record<string, number> = { CRITICAL: 4, HIGH: 8, MEDIUM: 24, LOW: 48 };
  return map[priority] || 24;
};

// ─── Master Data ───────────────────────────────────────────────────────────────

const categoriesData = [
  {
    name: 'Network',
    subcategories: ['WiFi', 'LAN', 'Internet', 'VPN', 'Firewall'],
  },
  {
    name: 'Hardware',
    subcategories: ['Laptop', 'Desktop', 'Printer', 'Monitor', 'UPS', 'Mouse/Keyboard'],
  },
  {
    name: 'Software',
    subcategories: ['Office Suite', 'OS Windows', 'Antivirus', 'ERP', 'Browser', 'Email Client'],
  },
  {
    name: 'Account',
    subcategories: ['Password Reset', 'New Account', 'Access Request', 'Account Lock', 'Email Setup'],
  },
  {
    name: 'Security',
    subcategories: ['Malware', 'Phishing', 'Data Breach', 'Suspicious Activity', 'Access Control'],
  },
  {
    name: 'Other',
    subcategories: ['General IT', 'Consultation', 'Training', 'Other'],
  },
];

const departmentsData = ['Finance', 'HR', 'Marketing', 'Operations', 'IT', 'Legal', 'Procurement', 'Sales'];

const techniciansData = [
  { name: 'Andi Pratama', email: 'andi@ithelpdesk.id' },
  { name: 'Budi Santoso', email: 'budi@ithelpdesk.id' },
  { name: 'Citra Dewi', email: 'citra@ithelpdesk.id' },
  { name: 'Dimas Kurniawan', email: 'dimas@ithelpdesk.id' },
  { name: 'Eka Putri', email: 'eka@ithelpdesk.id' },
];

const usersData = [
  { name: 'Admin Sistem', email: 'admin@ithelpdesk.id', role: 'ADMIN' as const },
  { name: 'Andi Pratama', email: 'andi@ithelpdesk.id', role: 'IT_SUPPORT' as const },
  { name: 'Budi Santoso', email: 'budi@ithelpdesk.id', role: 'IT_SUPPORT' as const },
  { name: 'Citra Dewi', email: 'citra@ithelpdesk.id', role: 'IT_SUPPORT' as const },
  { name: 'Dimas Kurniawan', email: 'dimas@ithelpdesk.id', role: 'IT_SUPPORT' as const },
  { name: 'Eka Putri', email: 'eka@ithelpdesk.id', role: 'IT_SUPPORT' as const },
  { name: 'Manager IT', email: 'manager@ithelpdesk.id', role: 'MANAGER' as const },
];

// ─── Issue Templates ──────────────────────────────────────────────────────────

const issueTemplates: Record<string, string[]> = {
  Network: [
    'WiFi tidak bisa terhubung', 'Koneksi internet lambat', 'VPN tidak bisa diakses',
    'LAN port tidak terdeteksi', 'Jaringan putus-putus', 'DNS tidak resolve', 
    'Internet mati total', 'Bandwidth terbatas', 'WiFi signal lemah', 'IP address conflict',
  ],
  Hardware: [
    'Laptop tidak mau menyala', 'Printer tidak bisa print', 'Monitor blank screen',
    'Keyboard tidak responsif', 'Mouse tidak bergerak', 'Laptop overheat',
    'Baterai laptop tidak charge', 'Printer paper jam', 'Harddisk penuh', 'RAM tidak cukup',
  ],
  Software: [
    'Aplikasi error saat dibuka', 'Windows tidak bisa update', 'Microsoft Office crash',
    'Antivirus expired', 'ERP tidak bisa login', 'Email tidak bisa kirim',
    'Browser tidak bisa buka website', 'Software terinstall tapi tidak jalan', 
    'Lisensi software expired', 'Program berjalan lambat',
  ],
  Account: [
    'Password reset', 'Akun terkunci', 'Butuh akses sistem baru', 'Email setup baru',
    'Lupa password', 'Akun tidak bisa login', 'Hak akses tidak sesuai',
    'Akun kadaluarsa', 'Butuh VPN access', 'Email tidak bisa diterima',
  ],
  Security: [
    'Laptop terkena virus', 'Menerima email phishing', 'Akses mencurigakan ke sistem',
    'Data diduga bocor', 'USB terinfeksi malware', 'Website diblokir antivirus',
    'Login dari lokasi tidak dikenal', 'File terenkripsi (ransomware)', 
    'Spam email masif', 'Popup iklan tidak wajar',
  ],
  Other: [
    'Konsultasi IT umum', 'Request training software baru', 'Permintaan informasi IT',
    'Bantuan instalasi perangkat', 'Migrasi data', 'Backup data tidak jalan',
  ],
};

const requesterNames = [
  'Ahmad Fauzi', 'Bintang Nugraha', 'Cindy Agustina', 'Dedi Setiawan', 'Elena Wulandari',
  'Farhan Hidayat', 'Gita Permata', 'Hendra Saputra', 'Indah Kurniasih', 'Joko Susanto',
  'Kartika Sari', 'Lukman Hakim', 'Maya Andriani', 'Nanda Pratiwi', 'Oki Firmansyah',
  'Putri Rahayu', 'Qori Mahmud', 'Rini Susanti', 'Sandi Wijaya', 'Tina Maulana',
  'Umar Siddiq', 'Vani Oktavia', 'Wawan Setiady', 'Xenia Hartanto', 'Yogi Prasetyo',
  'Zahra Amelia', 'Arif Budianto', 'Bella Puspita', 'Cahyo Nugroho', 'Dina Rahmawati',
];

const locations = [
  'Gedung A Lt. 1', 'Gedung A Lt. 2', 'Gedung A Lt. 3', 'Gedung B Lt. 1',
  'Gedung B Lt. 2', 'Gedung C Lt. 1', 'Gudang', 'Server Room', 'Ruang Rapat',
  'Lantai Produksi', 'Lobby', 'Kantin',
];

async function main() {
  console.log('🌱 Starting seed...');

  // Hash password
  const password = await bcrypt.hash('password123', 10);

  // Clean existing data
  console.log('🗑️  Cleaning existing data...');
  await prisma.ticket.deleteMany();
  await prisma.user.deleteMany();
  await prisma.subcategory.deleteMany();
  await prisma.category.deleteMany();
  await prisma.department.deleteMany();
  await prisma.technician.deleteMany();

  // Create users
  console.log('👤 Creating users...');
  await Promise.all(
    usersData.map((u) =>
      prisma.user.create({ data: { ...u, password } })
    )
  );

  // Create categories & subcategories
  console.log('📁 Creating categories...');
  const categoryMap: Record<string, { id: number; subcategories: Record<string, number> }> = {};
  for (const cat of categoriesData) {
    const createdCat = await prisma.category.create({ data: { name: cat.name } });
    const subcatMap: Record<string, number> = {};
    for (const sub of cat.subcategories) {
      const createdSub = await prisma.subcategory.create({
        data: { categoryId: createdCat.id, name: sub },
      });
      subcatMap[sub] = createdSub.id;
    }
    categoryMap[cat.name] = { id: createdCat.id, subcategories: subcatMap };
  }

  // Create departments
  console.log('🏢 Creating departments...');
  const deptMap: Record<string, number> = {};
  for (const dept of departmentsData) {
    const created = await prisma.department.create({ data: { name: dept } });
    deptMap[dept] = created.id;
  }

  // Create technicians
  console.log('👨‍💻 Creating technicians...');
  const techMap: Record<string, number> = {};
  for (const tech of techniciansData) {
    const created = await prisma.technician.create({ data: tech });
    techMap[tech.name] = created.id;
  }

  // Create tickets (1200 tickets)
  console.log('🎫 Creating 1200 tickets...');
  const startDate = new Date('2025-01-01');
  const endDate = new Date('2026-08-01');
  const techNames = Object.keys(techMap);
  const categoryNames = Object.keys(categoryMap);
  const deptNames = Object.keys(deptMap);

  // Priority distribution: MEDIUM 40%, LOW 25%, HIGH 25%, CRITICAL 10%
  const priorityPool = [
    ...Array(40).fill('MEDIUM'),
    ...Array(25).fill('LOW'),
    ...Array(25).fill('HIGH'),
    ...Array(10).fill('CRITICAL'),
  ];

  // Status distribution: RESOLVED 55%, CLOSED 20%, OPEN 10%, IN_PROGRESS 10%, PENDING 5%
  const statusPool = [
    ...Array(55).fill('RESOLVED'),
    ...Array(20).fill('CLOSED'),
    ...Array(10).fill('OPEN'),
    ...Array(10).fill('IN_PROGRESS'),
    ...Array(5).fill('PENDING'),
  ];

  const ticketsToCreate = [];

  for (let i = 1; i <= 1200; i++) {
    const catName = random(categoryNames);
    const cat = categoryMap[catName];
    const subcatNames = Object.keys(cat.subcategories);
    const subcatName = random(subcatNames);
    const subcatId = cat.subcategories[subcatName];
    const catId = cat.id;

    const deptName = random(deptNames);
    const deptId = deptMap[deptName];

    const techName = random(techNames);
    const techId = techMap[techName];

    const priority = random(priorityPool);
    const status = random(statusPool);
    const issue = random(issueTemplates[catName] || issueTemplates.Other);
    const requester = random(requesterNames);
    const location = random(locations);

    const slaTarget = getSlaTarget(priority);
    const createdAt = randomDate(startDate, endDate);

    let resolvedAt: Date | null = null;
    let resolutionTime: number | null = null;
    let slaStatus = 'PENDING';

    if (status === 'RESOLVED' || status === 'CLOSED') {
      // Realistic resolution time:
      // ~70% met SLA, ~30% breached
      const metSla = Math.random() < 0.72;
      
      let resolutionHours: number;
      if (metSla) {
        // Met: resolve within SLA (with some variation)
        resolutionHours = slaTarget * (0.3 + Math.random() * 0.65);
      } else {
        // Breached: exceed SLA
        resolutionHours = slaTarget * (1.1 + Math.random() * 2.5);
      }

      resolutionTime = Math.round(resolutionHours * 100) / 100;
      resolvedAt = new Date(createdAt.getTime() + resolutionTime * 60 * 60 * 1000);
      slaStatus = resolutionTime <= slaTarget ? 'MET' : 'BREACHED';
    }

    const ticketId = `TKT-${createdAt.getFullYear()}-${String(i).padStart(4, '0')}`;

    ticketsToCreate.push({
      ticketId,
      requesterName: requester,
      departmentId: deptId,
      location,
      categoryId: catId,
      subcategoryId: subcatId,
      issue,
      description: `${requester} melaporkan masalah: ${issue}. Lokasi: ${location}. Departemen: ${deptName}.`,
      priority: priority as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW',
      status: status as 'OPEN' | 'IN_PROGRESS' | 'PENDING' | 'RESOLVED' | 'CLOSED',
      technicianId: techId,
      slaTarget,
      resolutionTime,
      slaStatus: slaStatus as 'MET' | 'BREACHED' | 'PENDING',
      satisfaction: (status === 'RESOLVED' || status === 'CLOSED') ? randomInt(3, 5) : null,
      resolutionNotes: (status === 'RESOLVED' || status === 'CLOSED')
        ? `Masalah telah diselesaikan oleh ${techName}. ${issue} sudah diperbaiki.`
        : null,
      createdAt,
      resolvedAt,
    });
  }

  // Batch insert in chunks of 100
  const chunkSize = 100;
  for (let i = 0; i < ticketsToCreate.length; i += chunkSize) {
    const chunk = ticketsToCreate.slice(i, i + chunkSize);
    await prisma.ticket.createMany({ data: chunk });
    console.log(`   ✓ Created tickets ${i + 1} - ${Math.min(i + chunkSize, ticketsToCreate.length)}`);
  }

  // Summary
  const stats = await Promise.all([
    prisma.ticket.count(),
    prisma.ticket.count({ where: { slaStatus: 'MET' } }),
    prisma.ticket.count({ where: { slaStatus: 'BREACHED' } }),
    prisma.ticket.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS', 'PENDING'] } } }),
  ]);

  console.log('\n✅ Seed completed!');
  console.log('─────────────────────────────────────');
  console.log(`📊 Total Tickets  : ${stats[0]}`);
  console.log(`✅ SLA Met        : ${stats[1]}`);
  console.log(`❌ SLA Breached   : ${stats[2]}`);
  console.log(`🔓 Open Tickets   : ${stats[3]}`);
  console.log('─────────────────────────────────────');
  console.log('🔑 Default login credentials:');
  console.log('   Admin   : admin@ithelpdesk.id    / password123');
  console.log('   Support : andi@ithelpdesk.id     / password123');
  console.log('   Manager : manager@ithelpdesk.id  / password123');
  console.log('─────────────────────────────────────');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
