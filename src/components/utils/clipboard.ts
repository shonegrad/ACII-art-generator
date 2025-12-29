/**
 * Robust clipboard utility with fallbacks for different browser environments
 */

interface ClipboardResult {
  success: boolean;
  method: 'modern' | 'legacy' | 'manual';
  error?: string;
}

export async function copyToClipboard(text: string): Promise<ClipboardResult> {
  // Check if text is provided
  if (!text || typeof text !== 'string') {
    return {
      success: false,
      method: 'modern',
      error: 'No text provided to copy'
    };
  }

  // Method 1: Modern Clipboard API (preferred)
  if (navigator?.clipboard?.writeText) {
    try {
      // Check if we have permission
      if (navigator.permissions) {
        try {
          const permission = await navigator.permissions.query({ name: 'clipboard-write' as PermissionName });
          if (permission.state === 'denied') {
            throw new Error('Clipboard write permission denied');
          }
        } catch (permError) {
          // Permission API might not be available, continue anyway
          console.warn('Could not check clipboard permissions:', permError);
        }
      }

      await navigator.clipboard.writeText(text);
      return {
        success: true,
        method: 'modern'
      };
    } catch (error) {
      console.warn('Modern clipboard API failed:', error);
      // Fall through to legacy method
    }
  }

  // Method 2: Legacy execCommand (fallback)
  if (document?.execCommand) {
    try {
      // Create a temporary textarea element
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      textarea.style.top = '-9999px';
      textarea.style.opacity = '0';
      textarea.style.pointerEvents = 'none';
      textarea.setAttribute('readonly', '');
      
      document.body.appendChild(textarea);
      
      // Select the text
      textarea.select();
      textarea.setSelectionRange(0, text.length);
      
      // Try to copy
      const successful = document.execCommand('copy');
      document.body.removeChild(textarea);
      
      if (successful) {
        return {
          success: true,
          method: 'legacy'
        };
      } else {
        throw new Error('execCommand copy failed');
      }
    } catch (error) {
      console.warn('Legacy clipboard method failed:', error);
      // Fall through to manual method
    }
  }

  // Method 3: Manual fallback - create a text area and prompt user
  try {
    // Create a modal-like interface for manual copying
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.top = '50%';
    textarea.style.left = '50%';
    textarea.style.transform = 'translate(-50%, -50%)';
    textarea.style.width = '300px';
    textarea.style.height = '200px';
    textarea.style.padding = '10px';
    textarea.style.border = '2px solid #ccc';
    textarea.style.borderRadius = '8px';
    textarea.style.backgroundColor = '#fff';
    textarea.style.zIndex = '10000';
    textarea.style.fontSize = '12px';
    textarea.style.fontFamily = 'monospace';
    textarea.setAttribute('readonly', '');
    
    // Add backdrop
    const backdrop = document.createElement('div');
    backdrop.style.position = 'fixed';
    backdrop.style.top = '0';
    backdrop.style.left = '0';
    backdrop.style.width = '100%';
    backdrop.style.height = '100%';
    backdrop.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    backdrop.style.zIndex = '9999';
    
    document.body.appendChild(backdrop);
    document.body.appendChild(textarea);
    
    // Select all text
    textarea.select();
    textarea.setSelectionRange(0, text.length);
    
    // Create instructions
    const instructions = document.createElement('div');
    instructions.style.position = 'fixed';
    instructions.style.top = 'calc(50% + 120px)';
    instructions.style.left = '50%';
    instructions.style.transform = 'translateX(-50%)';
    instructions.style.backgroundColor = '#333';
    instructions.style.color = '#fff';
    instructions.style.padding = '10px 15px';
    instructions.style.borderRadius = '6px';
    instructions.style.fontSize = '14px';
    instructions.style.zIndex = '10001';
    instructions.textContent = 'Press Ctrl+C (Cmd+C on Mac) to copy, then click outside to close';
    
    document.body.appendChild(instructions);
    
    // Clean up on click outside or after timeout
    const cleanup = () => {
      if (document.body.contains(backdrop)) {
        document.body.removeChild(backdrop);
      }
      if (document.body.contains(textarea)) {
        document.body.removeChild(textarea);
      }
      if (document.body.contains(instructions)) {
        document.body.removeChild(instructions);
      }
    };
    
    backdrop.addEventListener('click', cleanup);
    
    // Auto cleanup after 10 seconds
    setTimeout(cleanup, 10000);
    
    return {
      success: true,
      method: 'manual'
    };
  } catch (error) {
    return {
      success: false,
      method: 'manual',
      error: error instanceof Error ? error.message : 'Manual copy fallback failed'
    };
  }
}

export function getClipboardSupportInfo(): {
  hasModernAPI: boolean;
  hasLegacyAPI: boolean;
  isSecureContext: boolean;
} {
  return {
    hasModernAPI: !!(navigator?.clipboard?.writeText),
    hasLegacyAPI: !!(document?.execCommand),
    isSecureContext: window?.isSecureContext ?? false
  };
}