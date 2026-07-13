import { useState, useEffect } from 'react';
import { userService } from '../api/services/userService';

/** Returns the numeric userId of the currently authenticated user */
export function useCurrentUserId(): number | null {
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    userService
      .getMyProfile()
      .then((u) => {
        // Fallback: một số backend trả về u.id thay vì u.userId
        const id = u.userId ?? u.userId ?? null;
        console.log('[useCurrentUserId] profile:', u, '→ resolved id:', id);
        setUserId(id);
      })
      .catch((e) => {
        console.error('[useCurrentUserId] getMyProfile failed:', e);
        setUserId(null);
      });
  }, []);

  return userId;
}