"use client";
import { useRef, useState } from "react";

const downloadFile = async (URL: string, filename: string) => {
	var dlAnchorElem = document.createElement("a");
	document.body.appendChild(dlAnchorElem);
	dlAnchorElem.setAttribute("href", URL);
	dlAnchorElem.setAttribute("download", filename);
	dlAnchorElem.click();
};

export default function Home() {
	const [isRecording, setIsRecording] = useState(false);

	const recordedData = useRef<Blob[]>([]);
	const recorderRef = useRef<MediaRecorder | null>(null);
	const screenRecordingStream = useRef<MediaStream | null>(null);
	const videoRef = useRef<HTMLVideoElement | null>(null);

	const startRecording = async () => {
		const stream = await requestPermissionFromUserToAccessScreen();
		recordedData.current = [];
		recorderRef.current = new MediaRecorder(stream);

		recorderRef.current.addEventListener("dataavailable", collectVideoData);
		recorderRef.current.addEventListener("stop", () => setIsRecording(false));
		recorderRef.current.addEventListener("start", () => setIsRecording(true));

		recorderRef.current.start();
	};

	const requestPermissionFromUserToAccessScreen = async () => {
		const stream: MediaStream = await navigator.mediaDevices.getDisplayMedia({
			video: true,
			audio: {
				noiseSuppression: true,
			},
		});
		screenRecordingStream.current = stream;
		if (videoRef.current) {
			videoRef.current.srcObject = stream;
			videoRef.current.play();
		}
		return stream;
	};

	const collectVideoData = (ev: BlobEvent) => {
		recordedData.current.push(ev.data);
	};

	const stopRecording = async () => {
		const recorder = recorderRef.current;
		if (recorder && videoRef.current) {
			recorder.stop();
			screenRecordingStream.current?.getTracks().map((track) => {
				track.stop();
				return;
			});
			videoRef.current.srcObject = null;
		}
	};

	const downloadVideo = () => {
		const videoBlob = new Blob(recordedData.current, {
			type: recordedData.current[0].type,
		});
		const downloadURL = window.URL.createObjectURL(videoBlob);
		downloadFile(downloadURL, `my-video.mkv`);

		window.URL.revokeObjectURL(downloadURL);
	};

	return (
		<main className='flex flex-col items-center gap-6 justify-center min-h-[100vh]'>
			<div className='mt-8'>
				{isRecording ? (
					<>
						<button onClick={stopRecording} className='btn btn-error'>
							{" "}
							stop recording
						</button>
					</>
				) : (
					<div className='flex gap-4 items-center'>
						<button onClick={startRecording} className='btn btn-active btn-neutral'>
							record screen
						</button>

						{recordedData.current.length ? (
							<button onClick={downloadVideo} className='btn btn-active btn-neutral'>
								download video
							</button>
						) : null}
					</div>
				)}
			</div>

			<video ref={videoRef} width={900} muted></video>
		</main>
	);
}
