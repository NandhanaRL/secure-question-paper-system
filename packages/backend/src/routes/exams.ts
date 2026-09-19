import { Router, Request, Response } from 'express';
import { prisma, logAudit } from '../db';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import _ from 'lodash';

const router = Router();

router.use(authenticate);

// Admin: Create Exam
router.post('/', requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, scheduledTime } = req.body;
    const exam = await prisma.exam.create({
      data: { title, description, scheduledTime: new Date(scheduledTime) }
    });
    await logAudit(req.user?.userId || null, req.user?.role || null, 'EXAM_CREATE', 'SUCCESS', { examId: exam.id }, req.ip || null);
    res.status(201).json(exam);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create exam' });
  }
});

// Admin: Create Blueprint for an exam
router.post('/:id/blueprint', requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { totalQuestions, difficultyDist, subjectDist } = req.body;
    const blueprint = await prisma.examBlueprint.create({
      data: {
        examId: req.params.id as string,
        totalQuestions,
        difficultyDist,
        subjectDist
      }
    });
    await logAudit(req.user?.userId || null, req.user?.role || null, 'BLUEPRINT_CREATE', 'SUCCESS', { examId: req.params.id }, req.ip || null);
    res.status(201).json(blueprint);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create blueprint' });
  }
});

// Admin: Activate Exam
router.post('/:id/activate', requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const exam = await prisma.exam.update({
      where: { id: req.params.id as string },
      data: { status: 'ACTIVE' }
    });
    await logAudit(req.user?.userId || null, req.user?.role || null, 'EXAM_ACTIVATE', 'SUCCESS', { examId: req.params.id }, req.ip || null);
    res.json(exam);
  } catch (err) {
    res.status(500).json({ error: 'Failed to activate exam' });
  }
});

// Candidate/Center: Fetch Paper Just-in-Time
router.get('/:id/paper', requireRole('CANDIDATE'), async (req: AuthRequest, res: Response) => {
  try {
    const examId = req.params.id;
    const exam: any = await prisma.exam.findUnique({
      where: { id: examId as string },
      include: { blueprint: true }
    });

    if (!exam || exam.status !== 'ACTIVE') {
      await logAudit(req.user?.userId || null, req.user?.role || null, 'PAPER_ACCESS', 'DENIED', { examId, reason: 'Exam not active' }, req.ip || null);
      return res.status(403).json({ error: 'Exam is not currently active' });
    }

    if (req.user?.examId !== examId) {
      await logAudit(req.user?.userId || null, req.user?.role || null, 'PAPER_ACCESS', 'DENIED', { examId, reason: 'IDOR attempt or mismatched token exam ID' }, req.ip || null);
      return res.status(403).json({ error: 'Unauthorized for this exam' });
    }

    // Hard time-boundary expiration check (max 4 hours past scheduled time)
    const FOUR_HOURS = 4 * 60 * 60 * 1000;
    const expirationTime = new Date(exam.scheduledTime.getTime() + FOUR_HOURS);
    
    if (new Date() > expirationTime) {
      await logAudit(req.user?.userId || null, req.user?.role || null, 'PAPER_ACCESS', 'DENIED', { examId, reason: 'Exam time window expired' }, req.ip || null);
      return res.status(403).json({ error: 'Exam time window has expired' });
    }

    if (!exam.blueprint) {
      return res.status(500).json({ error: 'Exam missing blueprint' });
    }

    // JIT Selection Logic:
    // We select random questions that match the blueprint.
    // In a production system, we'd do a complex query or use a materialized view.
    // For this implementation, we pull all approved questions and randomize them according to the dist.
    
    const allQuestions = await prisma.question.findMany({ where: { status: 'APPROVED' } });
    
    // Group questions by difficulty for sampling
    const byDifficulty = _.groupBy(allQuestions, 'difficulty');
    const diffDist = exam.blueprint.difficultyDist as Record<string, number>;
    
    let selectedQuestions: any[] = [];
    
    for (const [diff, count] of Object.entries(diffDist)) {
      const available = byDifficulty[diff] || [];
      const sampled = _.sampleSize(available, count);
      selectedQuestions = selectedQuestions.concat(sampled);
    }
    
    // Randomize final order
    selectedQuestions = _.shuffle(selectedQuestions);

    // Strip answers from the generated paper
    const paper = selectedQuestions.map(q => {
      const { correctAns, ...safeQ } = q;
      return safeQ;
    });

    await logAudit(req.user?.userId || null, req.user?.role || null, 'PAPER_GENERATION', 'SUCCESS', { examId, questionCount: paper.length }, req.ip || null);

    // Provide paper directly in response, do not store permanently.
    res.json({
      examId: exam.id,
      title: exam.title,
      questions: paper
    });

  } catch (err) {
    console.error('Failed to generate JIT paper', err);
    res.status(500).json({ error: 'Failed to generate paper' });
  }
});

export default router;
