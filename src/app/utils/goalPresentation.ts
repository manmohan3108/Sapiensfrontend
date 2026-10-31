import type { WorkflowRecord } from '../types/goalTypes';

export function workflowLifecycle(record: Pick<WorkflowRecord, 'finished'> & Partial<Pick<WorkflowRecord, 'retired'>>): string {
  if (record.retired === true) return 'Retired';
  if (record.finished === true) return 'Finished';
  if (record.finished === false) return 'Open';
  return 'Completion unknown';
}

export function workflowState(state: string): string {
  return `Workflow state: ${state || 'Not recorded'}`;
}
