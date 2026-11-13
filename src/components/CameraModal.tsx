import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, X, Check, AlertCircle } from 'lucide-react';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageDataUrl: string) => void;
  title?: string;
}

export const CameraModal: React.FC<CameraModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  title = 'Capturar Foto com a Câmera',
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isInitializing, setIsInitializing] = useState(false);

  // Iniciar stream da câmera
  const startCamera = async (mode: 'user' | 'environment') => {
    setIsInitializing(true);
    setErrorMessage(null);

    // Para qualquer stream anterior
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Câmera não suportada neste navegador ou ambiente.');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.warn('Erro ao acessar câmera:', err);
      if (err.name === 'NotAllowedError') {
        setErrorMessage('Permissão para uso da câmera foi negada. Conceda acesso para continuar.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorMessage('Nenhum dispositivo de câmera foi detectado no sistema.');
      } else {
        setErrorMessage(`Não foi possível iniciar a câmera (${err.message || 'Erro desconhecido'}). Você também pode usar a opção de upload de arquivo.`);
      }
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setCapturedImage(null);
      startCamera(facingMode);
    } else {
      // Parar stream ao fechar
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOpen, facingMode]);

  // Capturar frame atual do vídeo
  const takeSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Se estiver na câmera frontal, espelha horizontalmente para parecer natural
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    setCapturedImage(dataUrl);
  };

  const retakeSnapshot = () => {
    setCapturedImage(null);
  };

  const confirmSnapshot = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      handleClose();
    }
  };

  const handleClose = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCapturedImage(null);
    onClose();
  };

  const toggleFacingMode = () => {
    setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <Camera className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-800 text-base">{title}</h3>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport */}
        <div className="relative bg-slate-900 aspect-video flex items-center justify-center overflow-hidden">
          {errorMessage ? (
            <div className="p-6 text-center text-white max-w-xs">
              <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-rose-200 mb-4">{errorMessage}</p>
              <button
                onClick={() => startCamera(facingMode)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow transition-all"
              >
                Tentar Novamente
              </button>
            </div>
          ) : capturedImage ? (
            <img src={capturedImage} alt="Captura prévia" className="w-full h-full object-contain" />
          ) : (
            <>
              <video
                ref={videoRef}
                playsInline
                muted
                className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
              />
              {isInitializing && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 text-white text-sm">
                  <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                  Iniciando câmera...
                </div>
              )}
            </>
          )}

          {/* Canvas oculto para extração de pixels */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          {!capturedImage ? (
            <>
              <button
                type="button"
                onClick={toggleFacingMode}
                disabled={!!errorMessage}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Trocar Câmera
              </button>
              <button
                type="button"
                onClick={takeSnapshot}
                disabled={!!errorMessage || isInitializing}
                className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-medium text-sm rounded-xl shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <Camera className="w-4 h-4" />
                Capturar Foto
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={retakeSnapshot}
                className="flex-1 py-2.5 px-4 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium text-sm rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Tirar Outra
              </button>
              <button
                type="button"
                onClick={confirmSnapshot}
                className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-medium text-sm rounded-xl shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all"
              >
                <Check className="w-4 h-4" />
                Usar Esta Foto
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
