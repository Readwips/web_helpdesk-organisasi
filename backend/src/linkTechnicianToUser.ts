import prisma from './lib/prisma';

async function linkTechnicianToUser() {
  const users = await prisma.user.findMany({ where: { role: 'IT_SUPPORT' } });
  for (const user of users) {
    const tech = await prisma.technician.findUnique({ where: { email: user.email } });
    if (tech) {
      await prisma.user.update({ where: { id: user.id }, data: { technicianId: tech.id } });
      console.log(`✅ Linked: ${user.name} (${user.email}) -> Technician ID ${tech.id}`);
    } else {
      console.log(`⚠️  No technician found for: ${user.name} (${user.email})`);
    }
  }
  console.log('Done!');
  await prisma.$disconnect();
}

linkTechnicianToUser().catch(console.error);
