import type { ReactNode } from 'react';

interface PageContainerProps {
  readonly children: ReactNode;
  readonly id?: string;
  readonly className?: string;
  /** When true, page fills full height without top/bottom nav padding */
  readonly fullBleed?: boolean;
}

/**
 * Page content wrapper providing consistent padding and safe-area handling.
 * Accounts for TopBar (56px) and BottomNav (64px) fixed heights.
 *
 * @param {PageContainerProps} props
 */
export function PageContainer({
  children,
  id = 'main-content',
  className = '',
  fullBleed = false,
}: PageContainerProps) {
  return (
    <main
      id={id}
      className={`
        ${fullBleed
          ? 'h-dvh w-full'
          : 'min-h-dvh pt-[calc(72px+env(safe-area-inset-top))] pb-[calc(68px+env(safe-area-inset-bottom))] px-4'
        }
        ${className}
      `}
    >
      {children}
    </main>
  );
}
