import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import { Loader2, X } from "lucide-react";

/**
 * @param {{ modo: 'registrar' | 'identificar', onDescriptor?: (descriptor: number[]) => void, onIdentificado?: (descriptor: number[]) => void, onMatch?: (descriptor: number[]) => void, onCerrar?: () => void, onClose?: () => void }} props
 */
export default function CamaraFacial({ modo, onDescriptor, onIdentificado, onMatch, onCerrar, onClose }) {
  const cerrarCamara = onClose ?? onCerrar;
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [modelosListos, setModelosListos] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [capturando, setCapturando] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const cargarModelos = async () => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
        await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
        await faceapi.nets.faceRecognitionNet.loadFromUri("/models");
        if (!cancelled) setModelosListos(true);
      } catch (e) {
        console.error(e);
        if (!cancelled) setErrorMsg("No se pudieron cargar los modelos de reconocimiento facial.");
      }
    };

    cargarModelos();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!modelosListos) return undefined;

    let cancelled = false;

    const iniciarCamara = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play().catch(() => {});
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) setErrorMsg("No se pudo acceder a la cámara.");
      }
    };

    iniciarCamara();

    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      const video = videoRef.current;
      if (video) video.srcObject = null;
    };
  }, [modelosListos]);

  const handleCapturar = async () => {
    const video = videoRef.current;
    if (!video || !modelosListos) return;
    setErrorMsg("");
    setCapturando(true);
    try {
      const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();
      if (!detection) {
        setErrorMsg("No se detectó ningún rostro");
        return;
      }
      const descriptorArray = Array.from(detection.descriptor);
      if (modo === "registrar") {
        onDescriptor?.(descriptorArray);
      } else {
        (onMatch ?? onIdentificado)?.(descriptorArray);
      }
    } catch (e) {
      console.error(e);
      setErrorMsg("Error al analizar el rostro.");
    } finally {
      setCapturando(false);
    }
  };

  return (
    <div className="relative rounded-xl bg-slate-900 p-4 text-white shadow-inner">
      {cerrarCamara && (
        <button
          type="button"
          onClick={cerrarCamara}
          className="absolute right-2 top-2 z-10 rounded-lg bg-slate-700 p-1.5 text-slate-200 hover:bg-slate-600"
          aria-label="Cerrar"
        >
          <X className="h-5 w-5" />
        </button>
      )}

      {!modelosListos && !errorMsg && (
        <div className="flex flex-col items-center justify-center gap-3 py-12">
          <Loader2 className="h-10 w-10 animate-spin text-blue-400" />
          <p className="text-center text-sm text-slate-300">
            Cargando modelos de reconocimiento facial...
          </p>
        </div>
      )}

      {errorMsg && !modelosListos && (
        <p className="py-8 text-center text-sm text-red-400">{errorMsg}</p>
      )}

      {modelosListos && (
        <>
          <div className="flex justify-center overflow-hidden rounded-lg bg-black">
            <video ref={videoRef} autoPlay playsInline muted className="max-h-[320px] w-full max-w-lg object-cover" />
          </div>

          {errorMsg && modelosListos && (
            <p className="mt-2 text-center text-sm text-amber-400">{errorMsg}</p>
          )}

          <div className="mt-4 flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={handleCapturar}
              disabled={capturando}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow transition hover:bg-blue-700 disabled:opacity-50"
            >
              {capturando && <Loader2 className="h-4 w-4 animate-spin" />}
              Capturar
            </button>
          </div>
        </>
      )}
    </div>
  );
}
