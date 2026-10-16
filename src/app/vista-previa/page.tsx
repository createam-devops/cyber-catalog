import type { Metadata } from 'next';
import StorefrontPreviewReceiver from '@/components/store/StorefrontPreviewReceiver';

export const metadata: Metadata = {
  title: 'Vista previa',
  robots: { index: false, follow: false },
};

export default function StorefrontPreviewPage() {
  return <StorefrontPreviewReceiver />;
}
