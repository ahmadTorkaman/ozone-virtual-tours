import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UpdateChecker } from './UpdateChecker';

// Mock the Tauri APIs
const mockInvoke = vi.fn<[string, Record<string, unknown>?], Promise<unknown>>();
const mockListen = vi.fn<[string, unknown], Promise<() => void>>().mockResolvedValue(() => {});

vi.mock('@tauri-apps/api/core', () => ({
  invoke: (command: string, args?: Record<string, unknown>) => mockInvoke(command, args),
}));

vi.mock('@tauri-apps/api/event', () => ({
  listen: (event: string, handler: unknown) => mockListen(event, handler),
}));

describe('UpdateChecker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock for get_current_version
    mockInvoke.mockImplementation((command: string) => {
      if (command === 'get_current_version') {
        return Promise.resolve('1.0.0');
      }
      return Promise.resolve(null);
    });
  });

  it('should render current version', async () => {
    render(<UpdateChecker />);

    await waitFor(() => {
      expect(screen.getByText(/v1\.0\.0/)).toBeInTheDocument();
    });
  });

  it('should show "up to date" when no update is available', async () => {
    mockInvoke.mockImplementation((command: string) => {
      if (command === 'get_current_version') {
        return Promise.resolve('1.0.0');
      }
      if (command === 'check_for_updates') {
        return Promise.resolve(null);
      }
      return Promise.resolve(null);
    });

    render(<UpdateChecker />);

    // Click check button
    const checkButton = await screen.findByRole('button', { name: /check/i });
    fireEvent.click(checkButton);

    await waitFor(() => {
      expect(screen.getByText(/latest version/i)).toBeInTheDocument();
    });
  });

  it('should show update available when update exists', async () => {
    mockInvoke.mockImplementation((command: string) => {
      if (command === 'get_current_version') {
        return Promise.resolve('1.0.0');
      }
      if (command === 'check_for_updates') {
        return Promise.resolve({
          version: '1.1.0',
          body: 'Bug fixes and improvements',
        });
      }
      return Promise.resolve(null);
    });

    render(<UpdateChecker />);

    // Click check button
    const checkButton = await screen.findByRole('button', { name: /check/i });
    fireEvent.click(checkButton);

    await waitFor(() => {
      expect(screen.getByText(/1\.1\.0/)).toBeInTheDocument();
      expect(screen.getByText(/Bug fixes and improvements/)).toBeInTheDocument();
    });
  });

  it('should show error message when check fails', async () => {
    mockInvoke.mockImplementation((command: string) => {
      if (command === 'get_current_version') {
        return Promise.resolve('1.0.0');
      }
      if (command === 'check_for_updates') {
        return Promise.reject('Network error');
      }
      return Promise.resolve(null);
    });

    render(<UpdateChecker />);

    // Click check button
    const checkButton = await screen.findByRole('button', { name: /check/i });
    fireEvent.click(checkButton);

    await waitFor(() => {
      expect(screen.getByText(/Network error/)).toBeInTheDocument();
    });
  });

  it('should register event listeners on mount', async () => {
    render(<UpdateChecker />);

    await waitFor(() => {
      expect(mockListen).toHaveBeenCalledWith('update-available', expect.any(Function));
      expect(mockListen).toHaveBeenCalledWith('update-download-progress', expect.any(Function));
    });
  });
});
