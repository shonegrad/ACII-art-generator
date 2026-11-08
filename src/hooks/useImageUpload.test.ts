import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useImageUpload } from './useImageUpload';

vi.mock('sonner', () => ({
    toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

const createObjectURLMock = vi.fn(() => 'blob:mock-url');
const revokeObjectURLMock = vi.fn();

// Controllable FileReader mock so we can drive the load event ourselves.
type MockFileReader = {
    error: Error | null;
    onload: ((e: { target: { result: string } }) => void) | null;
    onerror: ((e: unknown) => void) | null;
    onabort: (() => void) | null;
    readAsDataURL: ReturnType<typeof vi.fn>;
    result: string;
};
const readerInstances: MockFileReader[] = [];

class MockFileReaderClass implements MockFileReader {
    error: Error | null = null;
    onload: ((e: { target: { result: string } }) => void) | null = null;
    onerror: ((e: unknown) => void) | null = null;
    onabort: (() => void) | null = null;
    readAsDataURL = vi.fn();
    result = '';
    constructor() {
        readerInstances.push(this);
    }
}

const originalFileReader = globalThis.FileReader;

describe('useImageUpload', () => {
    const onImageReady = vi.fn();

    beforeEach(() => {
        vi.restoreAllMocks();
        onImageReady.mockClear();
        createObjectURLMock.mockClear();
        revokeObjectURLMock.mockClear();
        readerInstances.length = 0;

        globalThis.URL.createObjectURL = createObjectURLMock;
        globalThis.URL.revokeObjectURL = revokeObjectURLMock;
        globalThis.FileReader = MockFileReaderClass as unknown as typeof FileReader;
    });

    afterEach(() => {
        globalThis.FileReader = originalFileReader;
    });

    it('rejects non-image files', async () => {
        const { result } = renderHook(() => useImageUpload(onImageReady));
        const file = new File(['content'], 'test.txt', { type: 'text/plain' });

        await act(async () => {
            await result.current.processFile(file);
        });

        expect(onImageReady).not.toHaveBeenCalled();
        expect(readerInstances).toHaveLength(0);
    });

    it('rejects files over 10 MB', async () => {
        const { result } = renderHook(() => useImageUpload(onImageReady));
        const maxSize = 10 * 1024 * 1024;
        const largeContent = new Uint8Array(maxSize + 1);
        const file = new File([largeContent], 'huge.png', { type: 'image/png' });

        await act(async () => {
            await result.current.processFile(file);
        });

        expect(onImageReady).not.toHaveBeenCalled();
        expect(readerInstances).toHaveLength(0);
    });

    it('accepts files under 10 MB and reads them via FileReader', async () => {
        const { result } = renderHook(() => useImageUpload(onImageReady));
        const file = new File([new Uint8Array(100)], 'small.png', { type: 'image/png' });

        // processFile runs synchronously until the first await (FileReader creation)
        const promise = result.current.processFile(file);

        expect(readerInstances).toHaveLength(1);
        expect(readerInstances[0].readAsDataURL).toHaveBeenCalledWith(file);

        // Resolve the FileReader load
        readerInstances[0].onload!({ target: { result: 'data:image/png;base64,mock' } });

        // Wait for the promise to settle, then flush the microtask that invokes onImageReady
        await act(async () => {
            await promise;
            await Promise.resolve();
        });

        expect(onImageReady).toHaveBeenCalledWith('data:image/png;base64,mock');
    });

    it('propagates FileReader errors', async () => {
        const { result } = renderHook(() => useImageUpload(onImageReady));
        const file = new File(['content'], 'broken.png', { type: 'image/png' });

        const promise = result.current.processFile(file);
        expect(readerInstances).toHaveLength(1);

        readerInstances[0].error = new Error('read failed');
        readerInstances[0].onerror!(new Error('read failed'));

        await expect(act(async () => {
            await promise;
        })).rejects.toThrow('read failed');

        expect(onImageReady).not.toHaveBeenCalled();
    });
});
