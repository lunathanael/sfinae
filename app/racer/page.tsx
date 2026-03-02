'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

export default function RacerPage() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [progress, setProgress] = useState(0);
    const [hasStarted, setHasStarted] = useState(false);
    const [scriptLoaded, setScriptLoaded] = useState(false);

    useEffect(() => {
        const preventDefault = (e: Event) => e.preventDefault();
        const canvas = canvasRef.current;
        if (canvas) {
            canvas.addEventListener('contextmenu', preventDefault);
        }

        // Setup the global Module object that Emscripten expects
        // @ts-expect-error Emscripten Module definition
        window.Module = {
            preRun: [],
            postRun: [],
            print: (...args: unknown[]) => {
                const text = args.join(' ');
                console.log(text);
            },
            printErr: (...args: unknown[]) => {
                const text = args.join(' ');
                console.error(text);
            },
            canvas: (() => {
                const canvas = document.getElementById('canvas');
                return canvas;
            })(),

            // This tells Emscripten where to find the .wasm file
            locateFile: (path: string, prefix: string) => {
                if (path.endsWith('.wasm')) {
                    return '/racer/' + path;
                }
                return prefix + path;
            },

            setStatus: (text: string) => {
                if (!text) {
                    setIsLoaded(true);
                    return;
                }
                const m = text.match(/([^(]+)\((\d+(\.\d+)?)\/(\d+)\)/);
                if (m) {
                    setProgress(parseInt(m[2], 10) / parseInt(m[4], 10));
                }
                console.log("Emscripten status:", text);
            },

            totalDependencies: 0,

            monitorRunDependencies: function (left: number) {
                this.totalDependencies = Math.max(this.totalDependencies, left);
                // @ts-expect-error Emscripten dynamic window object
                if (window.Module) {
                    // @ts-expect-error Emscripten module methods
                    window.Module.setStatus(left ? 'Preparing... (' + (this.totalDependencies - left) + '/' + this.totalDependencies + ')' : 'All downloads complete.');
                }
            }
        };

        // @ts-expect-error Emscripten setStatus
        window.Module.setStatus('Downloading...');

        window.onerror = (event) => {
            console.error('Exception thrown:', event);
        };

        return () => {
            if (canvas) {
                canvas.removeEventListener('contextmenu', preventDefault);
            }
        };
    }, []);

    const handleStart = async () => {
        try {
            // @ts-expect-error Emscripten module location
            if (window.Module && window.Module.requestFullscreen) {
                // @ts-expect-error Emscripten module structure
                window.Module.requestFullscreen(true, true); // (pointerLock, resize)
            }
        } catch (err) {
            console.error("Error attempting to enable fullscreen:", err);
        }
        setHasStarted(true);

        // Focus canvas so game can receive input immediately
        if (canvasRef.current) {
            canvasRef.current.focus();
        }
    };

    return (
        <div className="relative w-screen h-screen bg-[#0d1117] overflow-hidden flex items-center justify-center">
            {/* The Game Canvas */}
            <canvas
                id="canvas"
                ref={canvasRef}
                className={`w-full h-full object-contain bg-black focus:outline-none ${!hasStarted ? 'opacity-0' : 'opacity-100'} transition-opacity duration-500`}
                tabIndex={-1}
            />

            {/* Click to Play Overlay with Controls */}
            {!hasStarted && isLoaded && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#0d1117]">
                    <div className="text-center mb-12">
                        <h1 className="text-5xl font-bold tracking-tight text-[#58a6ff] mb-8" style={{ fontFamily: 'var(--font-space)' }}>
                            RACER
                        </h1>

                        <div className="grid grid-cols-2 gap-x-12 gap-y-6 text-left bg-white/5 border border-white/10 p-8 rounded-2xl backdrop-blur-sm">
                            <div className="col-span-2 text-center text-[#8b949e] font-medium tracking-widest text-sm mb-2">CONTROLS</div>

                            <div className="flex items-center justify-between gap-8">
                                <span className="text-[#8b949e] font-mono">ACCELERATE</span>
                                <div className="flex gap-2">
                                    <kbd className="px-3 py-1.5 bg-white/10 text-white rounded border border-white/20 font-mono text-sm shadow-[0_2px_0_rgba(255,255,255,0.2)]">↑</kbd>
                                </div>
                            </div>

                            <div className="flex items-center justify-between gap-8">
                                <span className="text-[#8b949e] font-mono">BRAKE / REVERSE</span>
                                <div className="flex gap-2">
                                    <kbd className="px-3 py-1.5 bg-white/10 text-white rounded border border-white/20 font-mono text-sm shadow-[0_2px_0_rgba(255,255,255,0.2)]">↓</kbd>
                                </div>
                            </div>

                            <div className="flex items-center justify-between gap-8">
                                <span className="text-[#8b949e] font-mono">STEER</span>
                                <div className="flex gap-2">
                                    <kbd className="px-3 py-1.5 bg-white/10 text-white rounded border border-white/20 font-mono text-sm shadow-[0_2px_0_rgba(255,255,255,0.2)]">←</kbd>
                                    <kbd className="px-3 py-1.5 bg-white/10 text-white rounded border border-white/20 font-mono text-sm shadow-[0_2px_0_rgba(255,255,255,0.2)]">→</kbd>
                                </div>
                            </div>

                            <div className="flex items-center justify-between gap-8">
                                <span className="text-[#8b949e] font-mono">RESET</span>
                                <div className="flex gap-2">
                                    <kbd className="px-3 py-1.5 bg-white/10 text-white rounded border border-white/20 font-mono text-sm shadow-[0_2px_0_rgba(255,255,255,0.2)]">R</kbd>
                                </div>
                            </div>

                            <div className="col-span-2 flex items-center justify-center gap-8 mt-2">
                                <span className="text-[#8b949e] font-mono">QUIT</span>
                                <div className="flex gap-2">
                                    <kbd className="px-3 py-1.5 bg-white/10 text-white rounded border border-white/20 font-mono text-sm shadow-[0_2px_0_rgba(255,255,255,0.2)]">Q</kbd>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleStart}
                        className="px-12 py-4 bg-[#58a6ff] hover:bg-[#79b8ff] text-[#0d1117] font-bold text-xl tracking-widest uppercase transition-all shadow-[0_0_20px_rgba(88,166,255,0.3)] hover:shadow-[0_0_30px_rgba(88,166,255,0.5)] rounded-full hover:scale-105 active:scale-95"
                        style={{ fontFamily: 'var(--font-space, monospace)' }}
                    >
                        Click to Play Fullscreen
                    </button>
                </div>
            )}

            {/* Loading Overlay */}
            {!isLoaded && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#0d1117]">
                    <div className="w-16 h-16 border-4 border-[#30363d] border-t-[#58a6ff] rounded-full animate-spin mb-8" />
                    <div className="text-[#8b949e] font-mono text-xl mb-4 tracking-widest">LOADING GAME ENGINE</div>
                    <div className="w-64 h-1 bg-[#30363d] rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[#58a6ff] transition-all duration-300 ease-out"
                            style={{ width: `${progress * 100}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Load the Emscripten JS asynchronously */}
            {/* The script must load for isLoaded to become true since it initializes WASM */}
            {!scriptLoaded && (
                <Script
                    src="/racer/racer.js"
                    strategy="afterInteractive"
                    onLoad={() => setScriptLoaded(true)}
                />
            )}
        </div>
    );
}
