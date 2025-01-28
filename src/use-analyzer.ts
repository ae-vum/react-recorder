import { useRef, useState, useCallback, useEffect } from "react";

type UseAudioAnalyzerOptions = {
    silenceThreshold?: number;
    silenceTimeout?: number;
    smoothingTimeConstant?: number;
    onSilenceDetected?: () => void;
    onSoundDetected?: () => void;
};

const useAudioAnalyzer = ({
    silenceThreshold = -50,
    silenceTimeout = 1500,
    smoothingTimeConstant = 0.3,
    onSilenceDetected,
    onSoundDetected,
}: UseAudioAnalyzerOptions = {}) => {
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const silenceTimeoutRef = useRef<NodeJS.Timer | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const detectSilence = useCallback(() => {
        if (!analyserRef.current || !isAnalyzing) return;

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);

        let weightedSum = 0;
        let weightSum = 0;
        for (let i = 0; i < dataArray.length; i++) {
            const freq = (i * audioContextRef.current!.sampleRate) / analyserRef.current!.fftSize;
            const weight = freq >= 300 && freq <= 3400 ? 1.5 : 0.7;
            weightedSum += dataArray[i] * weight;
            weightSum += weight;
        }
        const average = weightedSum / weightSum;
        const dB = 20 * Math.log10(average / 255);

        if (dB < silenceThreshold) {
            if (!silenceTimeoutRef.current) {
                silenceTimeoutRef.current = setTimeout(() => {
                    onSilenceDetected?.();
                }, silenceTimeout);
            }
        } else {
            if (silenceTimeoutRef.current) {
                clearTimeout(silenceTimeoutRef.current);
                silenceTimeoutRef.current = null;
                onSoundDetected?.();
            }
        }
    }, [silenceThreshold, silenceTimeout, isAnalyzing, onSilenceDetected, onSoundDetected]);

    const handleStart = useCallback(() => {
        audioContextRef.current = new AudioContext();
        analyserRef.current = audioContextRef.current.createAnalyser();

        analyserRef.current.fftSize = 2048;
        analyserRef.current.minDecibels = -70;
        analyserRef.current.maxDecibels = -10;
        analyserRef.current.smoothingTimeConstant = smoothingTimeConstant;

        setIsAnalyzing(true);
    }, [smoothingTimeConstant]);

    const handleData = useCallback((data: Blob) => {
        if (!audioContextRef.current || !analyserRef.current) return;

        data.arrayBuffer().then(buffer => {
            audioContextRef.current!.decodeAudioData(buffer).then(audioBuffer => {
                const source = audioContextRef.current!.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(analyserRef.current!);
                source.start();
            });
        });
    }, []);

    const handleStop = useCallback(() => {
        if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
            silenceTimeoutRef.current = null;
        }

        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }

        if (sourceRef.current) {
            sourceRef.current.disconnect();
            sourceRef.current = null;
        }

        analyserRef.current = null;
        setIsAnalyzing(false);
    }, []);

    const handleError = useCallback((error: Error) => {
        handleStop();
    }, [handleStop]);

    useEffect(() => {
        let animationFrameId: number;

        const analyze = () => {
            detectSilence();
            if (isAnalyzing) {
                animationFrameId = requestAnimationFrame(analyze);
            }
        };

        if (isAnalyzing) {
            analyze();
        }

        return () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        };
    }, [isAnalyzing, detectSilence]);

    return {
        onData: handleData,
        onStart: handleStart,
        onStop: handleStop,
        onError: handleError,
        isAnalyzing
    };
};

export { useAudioAnalyzer };
