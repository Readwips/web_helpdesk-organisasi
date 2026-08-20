import prisma from './lib/prisma';

async function seedEmployees() {
  const employees = [
    { employeeCode: '001', name: 'Prabowo Sutanto', department: 'Finance', position: 'Staff Keuangan' },
    { employeeCode: '002', name: 'Siti Rahayu', department: 'HR', position: 'HR Officer' },
    { employeeCode: '003', name: 'Bambang Wijaya', department: 'Marketing', position: 'Marketing Specialist' },
    { employeeCode: '004', name: 'Dewi Lestari', department: 'Operations', position: 'Operator' },
    { employeeCode: '005', name: 'Ahmad Yani', department: 'Sales', position: 'Sales Executive' },
    { employeeCode: '006', name: 'Rini Wulandari', department: 'Legal', position: 'Legal Staff' },
    { employeeCode: '007', name: 'Hendra Gunawan', department: 'Procurement', position: 'Procurement Staff' },
  ];

  for (const emp of employees) {
    await prisma.employee.upsert({
      where: { employeeCode: emp.employeeCode },
      update: {},
      create: emp,
    });
    console.log(`✅ Added: ${emp.name} (${emp.employeeCode})`);
  }
  console.log('✅ Employee seed done!');
  await prisma.$disconnect();
}

seedEmployees().catch(console.error);
