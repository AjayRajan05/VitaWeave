import { useCallback, useEffect, useState } from 'react';
import { getPatientsForCaregiver } from '@/lib/api';
import { getStoredUserId } from '@/lib/authGuard';
import { resolveWithDemoFallback } from '@/lib/dataPolicy';
import { ALL_PATIENTS, type Patient } from '@/app/constants/data';
import type { UserRole } from '@/lib/roles';

export function useCareTeamPatients(role: UserRole) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const userId = await getStoredUserId();
      if (!userId) {
        setPatients(resolveWithDemoFallback([], ALL_PATIENTS));
        return;
      }

      const live = await getPatientsForCaregiver(userId, role);
      setPatients(resolveWithDemoFallback(live, ALL_PATIENTS));
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { patients, loading, refresh };
}
