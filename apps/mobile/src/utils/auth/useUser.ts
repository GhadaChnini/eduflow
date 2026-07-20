
import { useCallback } from 'react';
import { useAuth } from './useAuth';

export const useUser = () => {
  const { auth, isReady } = useAuth();
  const user = auth?.user ?? null;
  const refetch = useCallback(async () => user, [user]);

  return {
    user,
    data: user,
    loading: !isReady,
    refetch,
  };
};

export default useUser;
