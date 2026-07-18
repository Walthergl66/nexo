import { useCallback, useEffect, useState } from 'react';
import {
  fetchAdminVerificationRequests,
  reviewVerificationRequest,
  type VerificationRequestResource,
} from '../../services/marketplaceApi';

type UseAdminVerificationsParams = {
  accessToken: string | null;
  enabled: boolean;
};

export function useAdminVerifications({ accessToken, enabled }: UseAdminVerificationsParams) {
  const [requests, setRequests] = useState<VerificationRequestResource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isReviewing, setIsReviewing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (!enabled || !accessToken) {
      setRequests([]);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    fetchAdminVerificationRequests(accessToken, currentPage)
      .then((page) => {
        if (!isMounted) {
          return;
        }
        setRequests(page.data);
        setLastPage(page.meta.last_page);
        setTotal(page.meta.total);
      })
      .catch(() => {
        if (isMounted) {
          setError('No pudimos cargar las solicitudes. Intenta nuevamente.');
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [accessToken, enabled, currentPage, refreshKey]);

  const review = useCallback(
    async (
      requestId: string,
      status: 'approved' | 'rejected' | 'suspended',
      rejectionReason?: string,
    ): Promise<boolean> => {
      if (!accessToken) {
        return false;
      }

      setIsReviewing(requestId);

      try {
        const updated = await reviewVerificationRequest(accessToken, requestId, status, rejectionReason);

        setRequests((prev) =>
          prev.map((r) => (r.id === updated.id ? updated : r)),
        );

        return true;
      } catch (err) {
        throw err;
      } finally {
        setIsReviewing(null);
      }
    },
    [accessToken],
  );

  const goToPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  return {
    requests,
    isLoading,
    isReviewing,
    error,
    currentPage,
    lastPage,
    total,
    refresh,
    review,
    goToPage,
  };
}
