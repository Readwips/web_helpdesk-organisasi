import { prisma } from '../lib/prisma';

export const logActivity = async (
  userId: number,
  action: string,
  description: string,
  metadata?: any,
  ipAddress?: string
) => {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        action,
        description,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null,
        ipAddress,
      },
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};
