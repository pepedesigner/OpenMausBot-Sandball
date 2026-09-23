/**
 * The sand material — the mascot's body, rendered as a ball of loose sand.
 *
 * The renderer paints the body as one filled path (the bot's gradient) and the
 * face on top of it. Rather than touch that, this layer bolts an SVG filter
 * onto the body: three passes, in this order,
 *
 *   1. crumbly silhouette — `feTurbulence` displaces the outline by fine noise,
 *      so the edge breaks into grains instead of staying a clean vector curve;
 *   2. dark grain        — a second, higher-frequency turbulence has its
 *      luminance turned into opacity, is clipped to the body, and is multiplied
 *      over it: this is the pass that reads as loose sand;
 *   3. light grain       — the same noise inverted and screened back on, so the
 *      surface is not uniformly darker.
 *
 * Only the body is filtered, so the eyes and mouth stay crisp: the character
 * keeps a readable face, the way a face stays readable when it is carved into a
 * sand sculpture.
 *
 * Everything is generated in the document — no texture image, no dependency.
 * The filter output is static for a given shape and colour, so the browser
 * caches it and only re-maps the cached bitmap while the body animates.
 */
import React from 'react'

/**
 * Tunables, in face-box units — the body is 228.541 across (see cursor-face-data).
 *
 * These are the shipped sand ball's own numbers, unchanged: both projects draw
 * in the same 259-unit viewBox around the same 114.2705 head centre, so the same
 * values give the same material — no rescaling. The grain is generated in that
 * space, which is why the filter hangs on a wrapper with no transform of its own.
 */
export interface SandOptions {
  /** Noise scale for the broken-up outline. Lower is chunkier. */
  edgeFreq: number
  edgeOctaves: number
  /** How far the outline is pushed around, in face-box units. */
  edgeScale: number
  /** Grain speckle size. Lower makes coarser grains. */
  grainFreq: number
  grainOctaves: number
  /** Strength of the dark grain pass. */
  grainAmount: number
  /** Strength of the light grain pass. */
  sparkleAmount: number
}

export const SAND_OPT: SandOptions = {
  edgeFreq: 0.5,
  edgeOctaves: 3,
  edgeScale: 3.4,
  grainFreq: 0.85,
  grainOctaves: 3,
  grainAmount: 0.45,
  sparkleAmount: 0.3,
}

/**
 * `feTurbulence` -> a mask driven by its own luminance.
 *
 * The colour matrix throws away RGB and writes the noise's luminance into the
 * alpha channel; `feComponentTransfer` then scales that alpha up to `amount`
 * (or, inverted, down from it).
 */
function GrainMask({
  id,
  seed,
  freq,
  octaves,
  amount,
  invert,
}: {
  id: string
  seed: number
  freq: number
  octaves: number
  amount: number
  invert: boolean
}): React.JSX.Element {
  return (
    <>
      <feTurbulence
        type="fractalNoise"
        baseFrequency={freq}
        numOctaves={octaves}
        seed={seed}
        result={`${id}_noise`}
      />
      <feColorMatrix
        in={`${id}_noise`}
        type="matrix"
        result={`${id}_lum`}
        values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.33 0.34 0.33 0 0"
      />
      <feComponentTransfer in={`${id}_lum`} result={`${id}_a`}>
        <feFuncA
          type="linear"
          slope={invert ? -amount : amount}
          intercept={invert ? amount : 0}
        />
      </feComponentTransfer>
    </>
  )
}

/**
 * The filter an instance points its body at. `id` must be unique per avatar —
 * two mascots sharing one filter id would also share its solved output.
 */
export function SandFilter({ id, opt = SAND_OPT }: { id: string; opt?: SandOptions }): React.JSX.Element {
  return (
    <filter
      id={id}
      x="-12%"
      y="-12%"
      width="124%"
      height="124%"
      colorInterpolationFilters="sRGB"
    >
      {/* 1. crumbly silhouette */}
      <feTurbulence
        type="fractalNoise"
        baseFrequency={opt.edgeFreq}
        numOctaves={opt.edgeOctaves}
        seed={7}
        result={`${id}_edge`}
      />
      <feDisplacementMap
        in="SourceGraphic"
        in2={`${id}_edge`}
        scale={opt.edgeScale}
        xChannelSelector="R"
        yChannelSelector="G"
        result={`${id}_crumb`}
      />

      {/* 2. dark grain, clipped to the body */}
      <GrainMask
        id={`${id}d`}
        seed={19}
        freq={opt.grainFreq}
        octaves={opt.grainOctaves}
        amount={opt.grainAmount}
        invert={false}
      />
      <feComposite
        in={`${id}d_a`}
        in2={`${id}_crumb`}
        operator="in"
        result={`${id}_grainOn`}
      />
      <feBlend
        in={`${id}_crumb`}
        in2={`${id}_grainOn`}
        mode="multiply"
        result={`${id}_dark`}
      />

      {/* 3. light grain, screened back on */}
      <GrainMask
        id={`${id}l`}
        seed={41}
        freq={opt.grainFreq * 1.13}
        octaves={opt.grainOctaves}
        amount={opt.sparkleAmount}
        invert
      />
      <feComposite
        in={`${id}l_a`}
        in2={`${id}_crumb`}
        operator="in"
        result={`${id}_sparkOn`}
      />
      <feBlend in={`${id}_dark`} in2={`${id}_sparkOn`} mode="screen" />
    </filter>
  )
}
