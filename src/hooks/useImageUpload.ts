import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';

export function useImageUpload(onImageReady: (url: string) => void) {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const objectUrlsRef = useRef<string[]>([]);

    /** Revoke all created object URLs to prevent memory leaks */
    const revokeObjectUrls = useCallback(() => {
        objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
        objectUrlsRef.current = [];
    }, []);

    /** Process any image file (from input or drag-and-drop) */
    const processFile = useCallback(
        async (file: File) => {
            if (isProcessing) {
                toast.info('Please wait for current processing to complete');
                return;
            }

            if (!file.type.startsWith('image/')) {
                toast.error('Please select an image file');
                return;
            }

            if (file.size > 10 * 1024 * 1024) {
                toast.error('File is too large. Maximum size is 10MB.');
                return;
            }

            const reader = new FileReader();
            const imageUrl = await new Promise<string>((resolve, reject) => {
                reader.onload = (event) => {
                    const result = event.target?.result;
                    if (typeof result === 'string' && result.startsWith('data:')) {
                        resolve(result);
                    } else {
                        reject(new Error('Invalid file data format'));
                    }
                };
                reader.onerror = () => reject(reader.error || new Error('FileReader failed'));
                reader.onabort = () => reject(new Error('File reading was aborted'));
                reader.readAsDataURL(file);
            });

            revokeObjectUrls();
            setSelectedImage(imageUrl);
            onImageReady(imageUrl);
        },
        [isProcessing, onImageReady, revokeObjectUrls]
    );

    /** Handle file input change */
    const handleFileUpload = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0];
            if (!file) return;
            processFile(file).catch(() => toast.error('Failed to upload file'));
        },
        [processFile]
    );

    /** Create and load a sample gradient image */
    const handleTrySample = useCallback(() => {
        if (isProcessing) {
            toast.info('Please wait for current processing to complete');
            return;
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            toast.error('Canvas not supported');
            return;
        }

        canvas.width = 200;
        canvas.height = 150;

        // Background gradient
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
        gradient.addColorStop(0, '#000000');
        gradient.addColorStop(0.5, '#666666');
        gradient.addColorStop(1, '#ffffff');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Contrast shapes
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(20, 20, 40, 40);
        ctx.fillStyle = '#000000';
        ctx.fillRect(140, 20, 40, 40);
        ctx.fillStyle = '#666666';
        ctx.fillRect(80, 80, 40, 40);

        const sampleUrl = canvas.toDataURL('image/png');
        revokeObjectUrls();
        setSelectedImage(sampleUrl);
        onImageReady(sampleUrl);
        toast.success('Sample image loaded');
    }, [isProcessing, onImageReady, revokeObjectUrls]);

    /** Fetch a random image from picsum.photos */
    const handleRandomImage = useCallback(async () => {
        if (isProcessing) return;
        setIsProcessing(true);

        try {
            const randomId = Math.floor(Math.random() * 1000);
            const response = await fetch(`https://picsum.photos/id/${randomId}/800/600`);
            if (!response.ok) throw new Error('Failed to fetch');

            const blob = await response.blob();
            revokeObjectUrls();
            const objectUrl = URL.createObjectURL(blob);
            objectUrlsRef.current.push(objectUrl);

            setSelectedImage(objectUrl);
            onImageReady(objectUrl);
        } catch {
            toast.error('Failed to load random image');
        } finally {
            setIsProcessing(false);
        }
    }, [isProcessing, onImageReady, revokeObjectUrls]);

    /** Remove current image and reset state */
    const handleRemoveImage = useCallback(() => {
        revokeObjectUrls();
        setSelectedImage(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, [revokeObjectUrls]);

    return {
        selectedImage,
        isProcessing: isProcessing,
        fileInputRef,
        processFile,
        handleFileUpload,
        handleTrySample,
        handleRandomImage,
        handleRemoveImage,
    };
}
