import { Router, Response } from 'express';
import { prisma, logAudit } from '../db';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Admin only: create a question
router.post('/', requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { text, subject, topic, difficulty, marks, type, options, correctAns } = req.body;
    
    const question = await prisma.question.create({
      data: { text, subject, topic, difficulty, marks, type, options, correctAns }
    });
    
    // @ts-ignore
    await logAudit(req.user?.userId || null, req.user?.role || null, 'QUESTION_CREATE', 'SUCCESS', { questionId: question.id }, req.ip || null);
    
    res.status(201).json(question);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create question' });
  }
});

// Admin only: list questions
router.get('/', requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const questions = await prisma.question.findMany();
    res.json(questions);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

// Admin only: update question
router.put('/:id', requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const question = await prisma.question.update({
      where: { id: req.params.id as string },
      data: req.body
    });
    // @ts-ignore
    await logAudit(req.user?.userId || null, req.user?.role || null, 'QUESTION_UPDATE', 'SUCCESS', { questionId: question.id }, req.ip || null);
    res.json(question);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update question' });
  }
});

// Admin only: delete question
router.delete('/:id', requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    await prisma.question.delete({ where: { id: req.params.id as string } });
    // @ts-ignore
    await logAudit(req.user?.userId || null, req.user?.role || null, 'QUESTION_DELETE', 'SUCCESS', { questionId: req.params.id }, req.ip || null);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete question' });
  }
});

export default router;
