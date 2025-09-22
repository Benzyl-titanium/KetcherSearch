/**
 * Utility function to copy text to clipboard, with fallback for iframe environments
 * @param text - The text to copy
 * @returns Promise<boolean> - True if copy was successful, false otherwise
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) {
    return false;
  }

  if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.warn('Modern clipboard API failed:', error);
    }
  }

  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '-9999px';
    textArea.style.opacity = '0';
    textArea.readOnly = true;

    document.body.appendChild(textArea);

    textArea.focus();
    textArea.setSelectionRange(0, text.length);
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);

    return successful;
  } catch (error) {
    console.error('Fallback copy method failed:', error);

    if (window.self !== window.top) {
      try {
        window.parent.postMessage({
          type: 'COPY_TEXT',
          text: text
        }, '*');
        return true;
      } catch (postError) {
        console.error('PostMessage failed:', postError);
      }
    }

    return false;
  }
}
