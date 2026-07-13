// Ambient background glow behind the hero. The blur is static (filter is
// expensive to animate); only transform moves, so the whole thing stays on
// the compositor. Parent section must be `relative isolate` so -z-10 keeps
// the orbs behind the content but above the page background.
export function GlowOrbs() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 overflow-visible"
    >
      <div className="absolute -top-40 left-1/4 h-[480px] w-[480px] rounded-full bg-[hsl(229_80%_60%/0.16)] blur-[120px] motion-safe:animate-orb-float" />
      <div className="absolute -right-20 top-16 h-[400px] w-[400px] rounded-full bg-[hsl(280_65%_60%/0.13)] blur-[110px] motion-safe:animate-orb-float-alt" />
      <div className="absolute -left-24 top-72 h-[320px] w-[320px] rounded-full bg-[hsl(320_70%_62%/0.09)] blur-[100px] motion-safe:animate-orb-float" />
    </div>
  )
}
