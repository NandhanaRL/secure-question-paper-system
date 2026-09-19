import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma, logAudit } from '../db';

const router = Router();
if (!process.env.JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is not set. Refusing to start in insecure mode.');
}
const JWT_SECRET = process.env.JWT_SECRET;

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      await logAudit(null, null, 'LOGIN_FAILED', 'FAILURE', { email, reason: 'User not found' }, req.ip || null);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      await logAudit(user.id, user.role, 'LOGIN_FAILED', 'FAILURE', { reason: 'Invalid password' }, req.ip || null);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '8h' });
    
    await logAudit(user.id, user.role, 'LOGIN_SUCCESS', 'SUCCESS', {}, req.ip || null);

    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// For candidates/centers joining a session
router.post('/center-login', async (req: Request, res: Response) => {
  const { admitCard, centerId, examId } = req.body;
  
  if (!admitCard || !centerId || !examId) {
    return res.status(400).json({ error: 'Missing credentials' });
  }

  try {
    // In a real system, we'd verify admitCard against a candidate DB.
    // For this prototype, we'll issue a token for the session.
    
    const token = jwt.sign({ userId: `cand_${admitCard}`, role: 'CANDIDATE', admitCard, centerId, examId }, JWT_SECRET, { expiresIn: '4h' });
    
    await logAudit(`cand_${admitCard}`, 'CANDIDATE', 'CENTER_LOGIN', 'SUCCESS', { centerId, examId }, req.ip || null);

    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
