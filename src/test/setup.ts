import '@testing-library/jest-dom';

// Mock clipboard API for tests
Object.assign(navigator, {
    clipboard: {
        writeText: vi.fn(),
        readText: vi.fn(),
    },
    permissions: {
        query: vi.fn().mockResolvedValue({ state: 'granted' }),
    },
});

// Mock window.isSecureContext
Object.defineProperty(window, 'isSecureContext', {
    value: true,
    writable: true,
});
