import { Router } from 'express';
import { verifyToken } from '../middleware/auth';
import { db } from '../lib/firebaseAdmin';
import { AppError, ErrorCode } from '../middleware/errorHandler';

export const authSmokeRouter = Router();

/**
 * Tiny smoke check for authenticated Firestore access.
 * Requires a valid Firebase ID token and reads users/{uid}.
 */
authSmokeRouter.get('/smoke', verifyToken, async (req, res, next) => {
  try {
    if (!req.user) {
      throw new AppError('Unauthenticated', 401, ErrorCode.UNAUTHORIZED);
    }

    const profileDoc = await db()
      .collection('users')
      .doc(req.user.uid)
      .get();

    res.status(200).json({
      ok: true,
      auth: {
        uid: req.user.uid,
        role: req.user.role ?? 'user',
      },
      firestore: {
        profileExists: profileDoc.exists,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});
