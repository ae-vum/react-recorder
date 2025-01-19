import React, { useState, useEffect, useRef } from 'react';

type UseRecorderOptions = {
    mimeType?: string;
    audioBitsPerSecond?: number;
    onStart?: () => void;
    onStop?: (blob: Blob) => void;
    onError?: (error: Error) => void;
};

type UseRecorderResult = {
    isRecording: boolean;
    isPaused: boolean;
    hasPermission: boolean;
    startRecording: () => Promise<void>;
    stopRecording: () => Promise<void>;
    pauseRecording: () => void;
    resumeRecording: () => void;
    recordedBlob: Blob | null;
    error: Error | null;
    requestPermission: () => Promise<void>;
};

const useRecorder = ({
    mimeType = 'audio/webm',
    audioBitsPerSecond = 128000,
    onStart,
    onStop,
    onError,
}: UseRecorderOptions = {}): UseRecorderResult => {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [hasPermission, setHasPermission] = useState(false);
    const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
    const [error, setError] = useState<Error | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const requestPermission = async () => {
        try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
            setHasPermission(true);
        } catch (err) {
            setError(err as Error);
        }
    };

    const startRecording = async () => {
        if (!hasPermission) {
            await requestPermission();
        }
        if (!hasPermission) return;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream, { mimeType, audioBitsPerSecond });

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: mimeType });
                setRecordedBlob(blob);
                chunksRef.current = [];
                onStop?.(blob);
            };

            mediaRecorder.onerror = (event) => {
                setError(new Error(event.error?.message || 'Unknown error'));
                onError?.(new Error(event.error?.message || 'Unknown error'));
            };

            mediaRecorder.start();
            mediaRecorderRef.current = mediaRecorder;
            setIsRecording(true);
            setIsPaused(false);
            onStart?.();
        } catch (err) {
            setError(err as Error);
            onError?.(err as Error);
        }
    };

    const stopRecording = async () => {
        if (!mediaRecorderRef.current) return;

        mediaRecorderRef.current.stop();
        setIsRecording(false);
        setIsPaused(false);
    };

    const pauseRecording = () => {
        if (!mediaRecorderRef.current) return;

        mediaRecorderRef.current.pause();
        setIsPaused(true);
    };

    const resumeRecording = () => {
        if (!mediaRecorderRef.current) return;

        mediaRecorderRef.current.resume();
        setIsPaused(false);
    };

    useEffect(() => {
        return () => {
            if (mediaRecorderRef.current && isRecording) {
                mediaRecorderRef.current.stop();
            }
        };
    }, [isRecording]);

    return {
        isRecording,
        isPaused,
        hasPermission,
        startRecording,
        stopRecording,
        pauseRecording,
        resumeRecording,
        recordedBlob,
        error,
        requestPermission,
    };
};

export { useRecorder };
