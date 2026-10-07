import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WaveformPlayerProps {
    audioUrl: string | null;
}

export function WaveformPlayer({ audioUrl }: WaveformPlayerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const wavesurferRef = useRef<WaveSurfer | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        if (!containerRef.current || !audioUrl) return;

        const wavesurfer = WaveSurfer.create({
            container: containerRef.current,
            waveColor: '#B2EBF2', 
            progressColor: '#0891B2', 
            cursorColor: '#0E7490', 
            barWidth: 2,
            barGap: 3,
            height: 80,
            barRadius: 3,
            normalize: true,
        });

        // Load the audio
        wavesurfer.load(audioUrl).catch((err) => {
            // destroy() on unmount aborts an in-flight load — expected, not an error
            if (err?.name !== 'AbortError') console.error('Failed to load audio', err);
        });

        // Event listeners
        wavesurfer.on('ready', () => {
            setDuration(wavesurfer.getDuration());
            wavesurferRef.current = wavesurfer;
        });

        wavesurfer.on('audioprocess', () => {
            setCurrentTime(wavesurfer.getCurrentTime());
        });

        wavesurfer.on('play', () => setIsPlaying(true));
        wavesurfer.on('pause', () => setIsPlaying(false));

        wavesurfer.on('finish', () => {
            setIsPlaying(false);
            setCurrentTime(0); 
        });

        // Seeking update
        wavesurfer.on('interaction', () => {
            setCurrentTime(wavesurfer.getCurrentTime());
        });

        return () => {
            wavesurfer.destroy();
        };
    }, [audioUrl]);

    const togglePlay = () => {
        if (wavesurferRef.current) {
            wavesurferRef.current.playPause();
        }
    };

    if (!audioUrl) return null;

    return (
        <div className="w-full bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <div ref={containerRef} className="w-full mb-4" />

            <div className="flex items-center justify-between px-2">
                <Button
                    onClick={togglePlay}
                    size="icon"
                    className="rounded-full w-10 h-10 bg-cyan-600 hover:bg-cyan-700 text-white shadow-md transition-all hover:shadow-cyan-200"
                >
                    {isPlaying ? (
                        <Pause className="w-4 h-4 fill-current" />
                    ) : (
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                    )}
                </Button>

                <div className="text-sm font-medium text-gray-500 font-mono">
                    {formatTime(currentTime)} / {formatTime(duration)}
                </div>
            </div>
        </div>
    );
}
