# react-recorder

A React hook for recording audio using the browser's MediaRecorder API.

## Installation

```bash
npm install react-recorder
```

## Usage

```jsx
import React from 'react';
import { useRecorder } from 'react-recorder';

function AudioRecorder() {
  const {
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
  } = useRecorder({
    onStart: () => console.log('Recording started'),
    onStop: (blob) => console.log('Recording stopped', blob),
    onError: (err) => console.error('Recording error', err),
  });

  const handleDownload = () => {
    if (recordedBlob) {
      const url = URL.createObjectURL(recordedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'recording.webm';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div>
      {!hasPermission && (
        <button onClick={requestPermission}>Request Microphone Permission</button>
      )}
      {hasPermission && (
        <>
          <button onClick={startRecording} disabled={isRecording}>
            Start Recording
          </button>
          <button onClick={stopRecording} disabled={!isRecording}>
            Stop Recording
          </button>
          <button onClick={pauseRecording} disabled={!isRecording || isPaused}>
            Pause Recording
          </button>
          <button onClick={resumeRecording} disabled={!isRecording || !isPaused}>
            Resume Recording
          </button>
          {recordedBlob && (
            <button onClick={handleDownload}>Download Recording</button>
          )}
          {error && <p>Error: {error.message}</p>}
        </>
      )}
    </div>
  );
}

export default AudioRecorder;
```

## API

### `useRecorder(options)`

A React hook that provides functionality for recording audio.

#### Options

-   `mimeType`: `string` (optional) - The MIME type for the recorded audio. Defaults to `audio/webm`.
-   `audioBitsPerSecond`: `number` (optional) - The audio bitrate in bits per second. Defaults to `128000`.
-   `onStart`: `() => void` (optional) - Callback function called when recording starts.
-   `onStop`: `(blob: Blob) => void` (optional) - Callback function called when recording stops, with the recorded audio blob as an argument.
-   `onError`: `(error: Error) => void` (optional) - Callback function called when an error occurs during recording.

#### Returns

-   `isRecording`: `boolean` - Indicates if the recording is currently active.
-   `isPaused`: `boolean` - Indicates if the recording is currently paused.
-   `hasPermission`: `boolean` - Indicates if the microphone permission has been granted.
-   `startRecording`: `() => Promise<void>` - Function to start recording.
-   `stopRecording`: `() => Promise<void>` - Function to stop recording.
-   `pauseRecording`: `() => void` - Function to pause recording.
-   `resumeRecording`: `() => void` - Function to resume recording.
-   `recordedBlob`: `Blob | null` - The recorded audio blob, or null if no recording has been made.
-   `error`: `Error | null` - An error object if an error occurred during recording, or null otherwise.
-   `requestPermission`: `() => Promise<void>` - Function to request microphone permission.

## License

MIT

