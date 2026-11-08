import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useExport } from './useExport';
import type { ColorCell } from './useAsciiConverter';

vi.mock('sonner', () => ({
    toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

const createObjectURLMock = vi.fn((_blob: Blob) => 'blob:mock-url');
const revokeObjectURLMock = vi.fn(() => undefined);

const originalCreateObjectURL = globalThis.URL.createObjectURL;
const originalRevokeObjectURL = globalThis.URL.revokeObjectURL;

describe('useExport', () => {
    const asciiOutput = '@#\n*+';
    const coloredOutput: ColorCell[][] = [
        [{ char: '@', color: 'rgb(0, 0, 0)' }, { char: '#', color: 'rgb(255, 255, 255)' }],
        [{ char: '*', color: 'rgb(128, 128, 128)' }, { char: '+', color: 'rgb(64, 64, 64)' }],
    ];

    beforeEach(() => {
        vi.restoreAllMocks();
        createObjectURLMock.mockClear();
        revokeObjectURLMock.mockClear();

        globalThis.URL.createObjectURL = createObjectURLMock;
        globalThis.URL.revokeObjectURL = revokeObjectURLMock;
    });

    afterEach(() => {
        globalThis.URL.createObjectURL = originalCreateObjectURL;
        globalThis.URL.revokeObjectURL = originalRevokeObjectURL;
    });

    it('downloadTxt creates a text/plain blob', () => {
        const { result } = renderHook(() =>
            useExport({ asciiOutput, coloredOutput: [], colorMode: false }),
        );

        act(() => {
            result.current.downloadTxt();
        });

        expect(createObjectURLMock).toHaveBeenCalledTimes(1);
        const blob = createObjectURLMock.mock.calls[0]![0] as unknown as Blob;
        expect(blob).toBeInstanceOf(Blob);
        expect(blob.type).toBe('text/plain');
    });

    it('downloadTxt does nothing when there is no output', () => {
        const { result } = renderHook(() =>
            useExport({ asciiOutput: '', coloredOutput: [], colorMode: false }),
        );

        act(() => {
            result.current.downloadTxt();
        });

        expect(createObjectURLMock).not.toHaveBeenCalled();
    });

    it('downloadSvg creates an image/svg+xml blob', () => {
        const { result } = renderHook(() =>
            useExport({ asciiOutput, coloredOutput: [], colorMode: false }),
        );

        act(() => {
            result.current.downloadSvg();
        });

        expect(createObjectURLMock).toHaveBeenCalledTimes(1);
        const blob = createObjectURLMock.mock.calls[0][0];
        expect(blob).toBeInstanceOf(Blob);
        expect(blob.type).toBe('image/svg+xml');
    });

    it('downloadSvg includes color fill attributes when color mode is enabled', () => {
        const { result } = renderHook(() =>
            useExport({ asciiOutput, coloredOutput, colorMode: true }),
        );

        act(() => {
            result.current.downloadSvg();
        });

        expect(createObjectURLMock).toHaveBeenCalledTimes(1);
        const blob = createObjectURLMock.mock.calls[0][0];
        expect(blob).toBeInstanceOf(Blob);
        expect(blob.type).toBe('image/svg+xml');
    });

    it('downloadSvg does nothing when there is no output', () => {
        const { result } = renderHook(() =>
            useExport({ asciiOutput: '', coloredOutput: [], colorMode: false }),
        );

        act(() => {
            result.current.downloadSvg();
        });

        expect(createObjectURLMock).not.toHaveBeenCalled();
    });

    it('revokes the object URL after the download timeout', () => {
        vi.useFakeTimers();
        const { result } = renderHook(() =>
            useExport({ asciiOutput, coloredOutput: [], colorMode: false }),
        );

        act(() => {
            result.current.downloadTxt();
        });
        expect(revokeObjectURLMock).not.toHaveBeenCalled();

        act(() => {
            vi.advanceTimersByTime(2000);
        });
        expect(revokeObjectURLMock).toHaveBeenCalledTimes(1);

        vi.useRealTimers();
    });
});
