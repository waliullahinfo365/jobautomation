let shuttingDown = false;

export function isShuttingDown(): boolean {
  return shuttingDown;
}

export function requestShutdown(): void {
  shuttingDown = true;
}
