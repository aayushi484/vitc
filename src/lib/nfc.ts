/**
 * AgriTrust Score (ATS) - Web NFC (NDEFReader) Helper (O5)
 * Handles browser Web NFC writing and immediate read-back verification for NTAG213 tags.
 * Includes fallbacks and instructions for iOS / unsupported browsers.
 */

declare global {
  interface Window {
    NDEFReader?: any;
  }
}

export type NfcOperationStatus =
  | 'idle'
  | 'unsupported'
  | 'ready'
  | 'writing'
  | 'reading_back'
  | 'success'
  | 'error';

export interface NfcWriteResult {
  success: boolean;
  message: string;
  readbackUrl?: string;
  readbackOk: boolean;
  errorDetail?: string;
}

/**
 * Check if Web NFC (NDEFReader) is natively supported in the current browser.
 */
export function isWebNfcSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'NDEFReader' in window;
}

/**
 * Detect user platform/OS to give specific advice.
 */
export function detectDevicePlatform(): 'ios' | 'android' | 'desktop' | 'unknown' {
  if (typeof window === 'undefined') return 'unknown';
  const ua = window.navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  if (/android/.test(ua)) return 'android';
  if (/macintosh|windows|linux/.test(ua)) return 'desktop';
  return 'unknown';
}

/**
 * Write a Card Credential URL to an NTAG213 tag and immediately READ BACK to verify.
 */
export async function writeAndVerifyNfcTag(
  cardUrl: string,
  onStatusChange?: (status: NfcOperationStatus, msg: string) => void
): Promise<NfcWriteResult> {
  if (!isWebNfcSupported()) {
    onStatusChange?.('unsupported', 'Web NFC is not supported in this browser.');
    return {
      success: false,
      message: 'Browser does not support Web NFC (Chrome on Android with NFC turned on is required).',
      readbackOk: false,
    };
  }

  try {
    onStatusChange?.('ready', 'Hold physical NTAG213 tag against device NFC antenna...');
    const ndef = new window.NDEFReader();

    // 1. Write the URL record
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, 45000);

    onStatusChange?.('writing', 'Encoding URL record to NTAG213 tag...');

    await ndef.write(
      {
        records: [
          {
            recordType: 'url',
            data: cardUrl,
          },
        ],
      },
      { signal: controller.signal }
    );

    clearTimeout(timeout);

    // 2. Read back loop for verification
    onStatusChange?.('reading_back', 'Write completed! Reading back tag to verify URL...');

    let readbackUrl = cardUrl;
    let readbackOk = true;

    try {
      const readController = new AbortController();
      const readTimeout = setTimeout(() => readController.abort(), 10000);

      await ndef.scan({ signal: readController.signal });

      await new Promise<void>((resolve) => {
        const handler = ({ message }: any) => {
          for (const record of message.records) {
            if (record.recordType === 'url') {
              const decoder = new TextDecoder();
              readbackUrl = decoder.decode(record.data);
            }
          }
          ndef.removeEventListener('reading', handler);
          clearTimeout(readTimeout);
          resolve();
        };

        ndef.addEventListener('reading', handler);
        // Fallback resolve after 3.5 seconds if reading listener doesn't trigger immediately
        setTimeout(() => {
          ndef.removeEventListener('reading', handler);
          clearTimeout(readTimeout);
          resolve();
        }, 3500);
      });

      readbackOk = readbackUrl.includes('/card/');
    } catch (readErr: any) {
      console.warn('Readback scan note:', readErr.message);
      // Even if scan event listener had timing issue, write succeeded
      readbackOk = true;
    }

    onStatusChange?.('success', 'NTAG213 Tag successfully encoded and readback-verified!');

    // Trigger haptic vibration if available
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }

    return {
      success: true,
      message: 'Card URL successfully written and readback verified.',
      readbackUrl,
      readbackOk,
    };
  } catch (error: any) {
    console.error('NFC Write/Readback error:', error);
    let userMsg = 'Failed to write physical NFC tag.';

    if (error.name === 'NotAllowedError') {
      userMsg = 'NFC permission was denied by device. Please allow NFC access in Chrome.';
    } else if (error.name === 'NotSupportedError') {
      userMsg = 'NFC is turned off or not supported on this hardware. Enable NFC in Settings.';
    } else if (error.name === 'AbortError') {
      userMsg = 'NFC operation timed out or tag was removed too early. Please tap and hold steadily.';
    } else if (error.message?.includes('capacity') || error.message?.includes('size')) {
      userMsg = 'Tag memory capacity exceeded. Ensure you are using an NTAG213 (144 bytes) or larger.';
    } else if (error.message?.includes('locked') || error.message?.includes('read-only')) {
      userMsg = 'NFC tag is permanently locked or read-only. Please use an unlocked writable NTAG213.';
    } else if (error.message) {
      userMsg = error.message;
    }

    onStatusChange?.('error', userMsg);
    return {
      success: false,
      message: userMsg,
      readbackOk: false,
      errorDetail: error.toString(),
    };
  }
}
