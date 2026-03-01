/**
 * In-process stop signal registry.
 * Allows any deep code path to check for a stop request without awaiting DB.
 */

const registry = new Map<string, boolean>();

export function markShouldStop(projectId: string): void {
  registry.set(projectId, true);
}

export function shouldStop(projectId: string): boolean {
  return registry.get(projectId) === true;
}

export function clearStop(projectId: string): void {
  registry.delete(projectId);
}
