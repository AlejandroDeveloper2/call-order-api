import * as dotenv from 'dotenv';
import { execFileSync } from 'child_process';
import * as path from 'path';

dotenv.config({
  path: path.resolve(__dirname, '../../.env.test'),
  override: process.env.E2E_IN_CONTAINER !== 'true',
});

if (
  process.platform === 'win32' &&
  process.env.E2E_IN_CONTAINER !== 'true' &&
  process.env.DB_HOST === 'localhost'
) {
  try {
    const machines = JSON.parse(
      execFileSync('podman', ['machine', 'list', '--format', 'json'], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }),
    ) as Array<{ Name?: string; Running?: boolean }>;
    const machine = machines.find(({ Running }) => Running);

    if (machine?.Name) {
      const interfaces = JSON.parse(
        execFileSync(
          'podman',
          [
            'machine',
            'ssh',
            machine.Name,
            'ip',
            '-j',
            '-4',
            'addr',
            'show',
            'dev',
            'eth0',
          ],
          { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
        ),
      ) as Array<{
        addr_info?: Array<{ family?: string; local?: string }>;
      }>;
      const machineAddress = interfaces
        .flatMap(({ addr_info }) => addr_info ?? [])
        .find(({ family }) => family === 'inet')?.local;

      if (machineAddress) process.env.DB_HOST = machineAddress;
    }
  } catch {
    // Fall back to localhost if Podman is unavailable.
  }
}
