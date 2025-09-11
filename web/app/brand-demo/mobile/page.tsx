export const metadata = {
  title: "ALAIN Brand Demo — Mobile",
};

export default function MobileDemo() {
  return (
    <div className="mx-auto max-w-7xl px-6 md:px-8 py-12 space-y-6">
      <h1 className="font-display font-bold text-[40px] leading-[44px] tracking-tight">Mobile Navigation Demo</h1>
      <p className="font-inter text-[18px] leading-[28px] text-ink-700">Resize to small screens and open the menu. All items have visible focus and keyboard support. Hit Escape to close.</p>
      <ul className="list-disc pl-6 font-inter text-[16px] leading-[26px] text-ink-700">
        <li>Hit area at least 44 px</li>
        <li>Focus ring uses alain-blue</li>
        <li>Drawer closes on outside click and Escape</li>
      </ul>
    </div>
  );
}

