import React, { useState, useCallback } from 'react';
import { removeTextFromImage, removeBackgroundFromImage, enhanceImage, restoreImage, colorizeImage, editImage } from './servicios/geminiService';
import { fileToBase64 } from './utils/fileUtils';
import { UploadIcon, SparklesIcon, DownloadIcon, ImageIcon, WandIcon, BackgroundIcon, RestoreIcon, ColorizeIcon, EditIcon } from './components/Icons';
import ImageComparator from './components/ImageComparator';

// Define types for clarity
type ProcessedImage = {
  dataUrl: string;
  mimeType: string;
};
type Tool = 'removeText' | 'removeBackground' | 'enhance' | 'restore' | 'colorize' | 'edit';
type ProcessedImages = {
  [key in Tool]?: ProcessedImage | null;
};

const App: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImages, setProcessedImages] = useState<ProcessedImages>({});
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<Tool>('removeText');
  const [editText, setEditText] = useState<string>('');

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type.startsWith('image/')) {
      try {
        const base64 = await fileToBase64(selectedFile);
        resetState(false); // Reset without clearing file input
        setOriginalImage(base64);
        setFile(selectedFile);
      } catch (err) {
        setError('Error al leer el archivo de imagen.');
        console.error(err);
      }
    } else {
        setError('Por favor, selecciona un archivo de imagen válido.');
        setOriginalImage(null);
        setFile(null);
    }
  };

  const handleProcessImage = useCallback(async () => {
    if (!originalImage || !file) {
      setError('Por favor, sube una imagen primero.');
      return;
    }
    
    if (activeTool === 'edit' && !editText.trim()) {
        setError('Por favor, escribe qué quieres cambiar en la imagen.');
        return;
    }

    setIsLoading(true);
    setError(null);
    setProcessedImages(prev => ({ ...prev, [activeTool]: null }));

    try {
      let result: { data: string; mimeType: string; };
      switch (activeTool) {
        case 'removeText':
          result = await removeTextFromImage(originalImage, file.type);
          break;
        case 'removeBackground':
          result = await removeBackgroundFromImage(originalImage, file.type);
          break;
        case 'enhance':
          result = await enhanceImage(originalImage, file.type);
          break;
        case 'restore':
            result = await restoreImage(originalImage, file.type);
            break;
        case 'colorize':
            result = await colorizeImage(originalImage, file.type);
            break;
        case 'edit':
            result = await editImage(originalImage, file.type, editText);
            break;
        default:
          throw new Error('Herramienta no válida seleccionada');
      }
      const dataUrl = `data:${result.mimeType};base64,${result.data}`;
      setProcessedImages(prev => ({ 
          ...prev, 
          [activeTool]: { dataUrl, mimeType: result.mimeType } 
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ocurrió un error desconocido.';
      setError(`Falló el proceso: ${errorMessage}`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [originalImage, file, activeTool, editText]);

  const resetState = (clearInput = true) => {
    setOriginalImage(null);
    setProcessedImages({});
    setFile(null);
    setIsLoading(false);
    setError(null);
    setActiveTool('removeText');
    setEditText('');
    if (clearInput) {
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if(fileInput) fileInput.value = '';
    }
  };

  const toolConfig = {
    removeText: { 
        name: 'Quitar Texto', 
        icon: <SparklesIcon className="w-5 h-5" />, 
        cta: 'Quitar Texto',
        description: 'La IA detecta y elimina cualquier texto de tu imagen, reconstruyendo el fondo de forma inteligente.'
    },
    removeBackground: { 
        name: 'Quitar Fondo', 
        icon: <BackgroundIcon className="w-5 h-5" />, 
        cta: 'Quitar Fondo',
        description: 'La IA aísla el sujeto principal y elimina el fondo, dejándolo 100% transparente (formato PNG).'
    },
    edit: {
        name: 'Editar con Texto',
        icon: <EditIcon className="w-5 h-5" />,
        cta: 'Aplicar Edición',
        description: 'Describe el cambio que quieres hacer. Ej: "añadirle un sombrero de vaquero" o "quitar el coche rojo".'
    },
    enhance: { 
        name: 'Mejorar Imagen', 
        icon: <WandIcon className="w-5 h-5" />, 
        cta: 'Mejorar Calidad',
        description: 'Aumenta la resolución y calidad de tu imagen, corrigiendo imperfecciones para un acabado profesional.'
    },
    restore: {
        name: 'Restaurar Foto',
        icon: <RestoreIcon className="w-5 h-5" />,
        cta: 'Restaurar Foto',
        description: 'Repara fotos antiguas o dañadas eliminando arañazos, rasgaduras y manchas, devolviéndoles su gloria.'
    },
    colorize: {
        name: 'Colorear',
        icon: <ColorizeIcon className="w-5 h-5" />,
        cta: 'Añadir Color',
        description: 'Da vida a tus fotos en blanco y negro aplicando colores naturales y realistas de forma inteligente.'
    }
  };
  
  const currentResult = processedImages[activeTool];
  
  const getFileExtension = (mimeType: string | undefined): string => {
    if (!mimeType) return 'png';
    return mimeType.split('/')[1] || 'png';
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-6xl">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-500">
            Herramientas de Imagen con IA
          </h1>
          <p className="text-gray-400 mt-2 text-lg">Sube una imagen y deja que la IA la perfeccione para ti.</p>
        </header>

        <main className="bg-gray-800/50 rounded-2xl shadow-2xl p-6 md:p-8 border border-gray-700 backdrop-blur-sm">
          {!originalImage && (
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-600 rounded-xl p-12 text-center hover:border-indigo-500 transition-colors duration-300">
              <UploadIcon className="w-16 h-16 text-gray-500 mb-4" />
              <h2 className="text-2xl font-semibold mb-2">Sube tu Imagen</h2>
              <p className="text-gray-400 mb-6">Arrastra y suelta o haz clic para seleccionar un archivo</p>
              <label htmlFor="file-upload" className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105">
                Seleccionar Imagen
              </label>
              <input id="file-upload" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
            </div>
          )}

          {error && (
            <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg my-6 text-center" role="alert">
              <p>{error}</p>
            </div>
          )}

          {originalImage && (
            <div className="flex flex-col gap-8">
              {/* Tabs */}
              <div className="flex justify-center border-b border-gray-700 overflow-x-auto pb-1">
                <div className="flex">
                    {(Object.keys(toolConfig) as Tool[]).map(tool => (
                      <button
                        key={tool}
                        onClick={() => setActiveTool(tool)}
                        className={`flex items-center gap-2 px-4 py-3 font-semibold transition-colors duration-200 border-b-2 whitespace-nowrap ${
                          activeTool === tool
                            ? 'text-indigo-400 border-indigo-400'
                            : 'text-gray-400 border-transparent hover:text-white hover:border-gray-500'
                        }`}
                      >
                        {toolConfig[tool].icon}
                        {toolConfig[tool].name}
                      </button>
                    ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {/* Original Image */}
                <div className="flex flex-col items-center bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                  <h3 className="text-xl font-semibold text-gray-300 mb-3 flex items-center gap-2"><ImageIcon className="w-6 h-6" />Imagen Original</h3>
                  <img src={originalImage} alt="Original" className="rounded-md max-h-[60vh] object-contain" />
                </div>

                {/* Edited Image */}
                <div className="relative flex flex-col items-center justify-center bg-gray-900/50 p-4 rounded-lg border border-gray-700 min-h-[300px] h-full">
                   <h3 className="text-xl font-semibold text-gray-300 mb-2 flex items-center gap-2">{toolConfig[activeTool].icon}Resultado</h3>
                   <p className="text-sm text-gray-400 mb-3 text-center px-4">{toolConfig[activeTool].description}</p>
                   {activeTool === 'edit' && (
                     <div className="w-full px-4 mb-4">
                        <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            placeholder="Ej: 'agrega un sombrero de vaquero...'"
                            className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                            rows={2}
                        />
                     </div>
                   )}
                  {isLoading && (
                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center rounded-lg z-10">
                      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-400"></div>
                      <p className="mt-4 text-lg">La IA está trabajando...</p>
                    </div>
                  )}
                  {currentResult ? (
                     activeTool === 'enhance' || activeTool === 'restore' || activeTool === 'colorize' ? (
                       <ImageComparator original={originalImage} edited={currentResult.dataUrl} />
                     ) : (
                      <img src={currentResult.dataUrl} alt="Editada" className="rounded-md max-h-[60vh] object-contain" />
                     )
                  ) : (
                    !isLoading && <div className="text-gray-500 text-center flex-grow flex items-center justify-center">El resultado aparecerá aquí.</div>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-4">
                <button 
                  onClick={handleProcessImage} 
                  disabled={isLoading}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                >
                  {toolConfig[activeTool].icon}
                  {isLoading ? 'Procesando...' : toolConfig[activeTool].cta}
                </button>
                {currentResult && (
                    <a
                        href={currentResult.dataUrl}
                        download={`${activeTool}-resultado.${getFileExtension(currentResult.mimeType)}`}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition-transform transform hover:scale-105"
                    >
                        <DownloadIcon className="w-5 h-5" />
                        Descargar
                    </a>
                )}
                 <button 
                  onClick={() => resetState(true)} 
                  className="w-full sm:w-auto bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-8 rounded-lg transition-transform transform hover:scale-105"
                >
                  Empezar de Nuevo
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
