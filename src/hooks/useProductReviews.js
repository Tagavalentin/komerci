// @ts-nocheck
import { useCallback, useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';

export default function useProductReviews(productId, onStats) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState(null);
  const onStatsRef = useRef(onStats);
  onStatsRef.current = onStats;

  useEffect(() => {
    base44.auth.me().then(setMe).catch(() => setMe(null));
  }, []);

  const reload = useCallback(async () => {
    if (!productId) return;
    try {
      const page = await base44.entities.ProductReview.filter(
        { product_id: productId },
        { sort: '-created_date', limit: 100 },
      );
      const list = Array.isArray(page) ? page : page?.items || [];
      setReviews(list);
      onStatsRef.current?.({
        somme: list.reduce((sum, review) => sum + (Number(review.note) || 0), 0),
        count: list.length,
      });
    } catch (error) {
      console.error('Chargement des avis impossible :', error);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    setLoading(true);
    reload();
  }, [reload]);

  return { reviews, loading, me, reload };
}
