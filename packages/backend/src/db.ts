import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export async function logAudit(userId: string | null, role: string | null, action: string, status: string, details: any, ipAddress: string | null) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        role,
        action,
        status,
        details: details || {},
        ipAddress,
      }
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}
