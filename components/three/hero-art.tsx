"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useSyncExternalStore } from "react";
import { onIdleAfterLoad } from "@/lib/idle";

// Loaded only in the browser, in its own chunk, after the page is interactive.
const OrnamentScene = dynamic(() => import("./ornament-scene"), { ssr: false });

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

// CPU-only WebGL implementations: rendering there blocks the main thread,
// so these devices get the static illustration instead.
const SOFTWARE_RENDERER = /swiftshader|llvmpipe|softpipe|software|basic render/i;

let gpuWebGL: boolean | undefined;
function hasGpuWebGL(): boolean {
  if (gpuWebGL === undefined) {
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
      if (!gl) {
        gpuWebGL = false;
      } else {
        const info = gl.getExtension("WEBGL_debug_renderer_info");
        const renderer = String(
          gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER) ?? "",
        );
        gpuWebGL = !SOFTWARE_RENDERER.test(renderer);
        gl.getExtension("WEBGL_lose_context")?.loseContext();
      }
    } catch {
      gpuWebGL = false;
    }
  }
  return gpuWebGL;
}

const lowMemory = () =>
  ((navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8) < 2;

function subscribe(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

const prefersReducedMotion = () => window.matchMedia(REDUCED_MOTION).matches;

/**
 * Whether this device should get the live scene. The WebGL probe itself is
 * costly on CPU renderers, so it only runs once the page is loaded and idle.
 */
function useCapableDevice() {
  const [capable, setCapable] = useState(false);
  useEffect(() => onIdleAfterLoad(() => setCapable(!lowMemory() && hasGpuWebGL())), []);
  return capable;
}

/**
 * Decorative hero art. Shows the static illustration first (server-rendered),
 * then fades in the live 3D ornament if motion is allowed and WebGL works.
 */
export function HeroArt() {
  const reducedMotion = useSyncExternalStore(subscribe, prefersReducedMotion, () => true);
  const capable = useCapableDevice();
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [paused, setPaused] = useState(false);
  const show3D = !reducedMotion && capable && !failed;

  return (
    <>
      <div aria-hidden="true" className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element -- tiny local SVG, no optimisation needed */}
        <img
          src="/hero-fallback.svg"
          alt=""
          width={600}
          height={600}
          fetchPriority="high"
          className={`absolute inset-0 h-full w-full transition-opacity duration-700 ${
            show3D && ready ? "opacity-0" : "opacity-100"
          }`}
        />
        {show3D && (
          <div
            className={`absolute inset-0 transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"}`}
          >
            <OrnamentScene
              paused={paused}
              onReady={() => setReady(true)}
              onError={() => setFailed(true)}
            />
          </div>
        )}
      </div>
      {/* WCAG 2.2.2: moving content that runs longer than 5 seconds needs a pause control. */}
      {show3D && ready && (
        <button
          type="button"
          aria-pressed={paused}
          onClick={() => setPaused((p) => !p)}
          className="absolute bottom-2 right-2 inline-flex min-h-11 items-center rounded-full border border-line-night bg-night/80 px-4 text-sm font-medium text-frost-muted transition-colors hover:border-frost-muted hover:text-frost"
        >
          {paused ? "Play animation" : "Pause animation"}
        </button>
      )}
    </>
  );
}
