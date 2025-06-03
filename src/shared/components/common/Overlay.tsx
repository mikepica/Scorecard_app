"use client"

export function Overlay({ isVisible, onClick }: { isVisible: boolean; onClick: () => void }) {
  if (!isVisible) return null

  return <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={onClick} />
}
