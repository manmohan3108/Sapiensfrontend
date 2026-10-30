import { useEffect, useRef, useState } from 'react';
import { simulationService } from '../../core/services/simulationService';
import type { InspectionActivityPage, InspectionOverviewDetails, InspectionSpecificationResponse } from '../../types/simulationTypes';
import { mergeActivityPages } from './simulationOverviewModel';

const errorMessage = (error: unknown) => error instanceof Error ? error.message : 'The saved records could not be loaded.';
type Snapshot = { overview: InspectionOverviewDetails; spec: InspectionSpecificationResponse | null; page: InspectionActivityPage | null };

export function useSimulationOverview(runId: string) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [contextError, setContextError] = useState('');
  const [revision, setRevision] = useState(0);
  const paging = useRef<AbortController | null>(null);
  const refreshing = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    refreshing.current = true;
    paging.current?.abort(); paging.current = null;
    setLoadingMore(false); setLoading(true); setError(''); setContextError('');
    setSnapshot(current => current?.overview.run_id === runId ? current : null);
    async function load() {
      const overview = await simulationService.inspectionOverview(runId, undefined, controller.signal);
      if (controller.signal.aborted) return;
      const [spec, page] = await Promise.allSettled([
        simulationService.inspectionSpecification(runId, { through: overview.through }, controller.signal),
        simulationService.inspectionJourney(runId, { through: overview.through, order: 'desc', limit: 30 }, controller.signal),
      ]);
      if (controller.signal.aborted) return;
      setSnapshot({ overview, spec: spec.status === 'fulfilled' ? spec.value : null, page: page.status === 'fulfilled' ? page.value : null });
      if (spec.status === 'rejected') setContextError('The test-case context could not load. Recorded activity is still available.');
      if (page.status === 'rejected') setError(errorMessage(page.reason));
    }
    void load().catch(problem => { if (!controller.signal.aborted) setError(errorMessage(problem)); })
      .finally(() => { if (!controller.signal.aborted) { setLoading(false); refreshing.current = false; } });
    return () => { controller.abort(); paging.current?.abort(); };
  }, [runId, revision]);

  async function loadMore() {
    const page = snapshot?.page;
    if (!page?.has_more || page.next_before == null || paging.current || refreshing.current || page.run_id !== runId) return;
    const controller = new AbortController(); paging.current = controller;
    setLoadingMore(true); setError('');
    try {
      const next = await simulationService.inspectionJourney(runId, { through: page.through, before: page.next_before, order: 'desc', limit: 30 }, controller.signal);
      if (controller.signal.aborted) return;
      const merged = mergeActivityPages(page, next);
      setSnapshot(current => current?.page === page ? { ...current, page: merged } : current);
    } catch (problem) { if (!controller.signal.aborted) setError(errorMessage(problem)); }
    finally { if (!controller.signal.aborted) { paging.current = null; setLoadingMore(false); } }
  }
  function refresh() {
    // Synchronous guard also stops a pagination click before the effect runs.
    if (refreshing.current) return;
    refreshing.current = true; paging.current?.abort(); paging.current = null;
    setRevision(value => value + 1);
  }
  return { snapshot: snapshot?.overview.run_id === runId ? snapshot : null, loading, loadingMore, error, contextError, refresh, loadMore };
}
