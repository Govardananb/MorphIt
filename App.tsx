import React, { useState, useRef, useEffect } from 'react';

// SVG Icons
const UploadIcon = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="transition-transform duration-300 ease-out">
    <path d="M14 26L24 16L34 26" stroke="#715959" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M24 16V34" stroke="#715959" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M40 32V38C40 39.1046 39.1046 40 38 40H10C8.89543 40 8 39.1046 8 38V32" stroke="#715959" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CloseIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 6L6 18" stroke="#715959" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M6 6L18 18" stroke="#715959" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const ChevronDownIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 9L12 15L18 9" stroke="#715959" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const PlayIcon = () => (
     <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5 3L19 12L5 21V3Z" stroke="#715959" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const formatGroups = {
  "Image": ["JPG", "PNG", "WEBP", "GIF", "SVG"],
  "Document": ["PDF", "DOCX", "TXT"],
  "Audio": ["MP3", "WAV", "FLAC"],
  "Video": ["MP4", "MOV", "MKV"],
  "Archive": ["ZIP", "7Z"],
};

const imageFormats = new Set(formatGroups["Image"]);

const getCategoryKey = (file: File): keyof typeof formatGroups | null => {
    const mime = file.type;
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
  
    if (mime.startsWith('image/')) return 'Image';
    if (['pdf', 'docx', 'txt'].includes(ext)) return 'Document';
    if (mime.startsWith('audio/')) return 'Audio';
    if (mime.startsWith('video/')) return 'Video';
    if (['zip', '7z'].includes(ext)) return 'Archive';
  
    return null;
};


function App() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);
  const [isFormatDropdownOpen, setIsFormatDropdownOpen] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [isConverted, setIsConverted] = useState(false);
  const [convertedFileBlob, setConvertedFileBlob] = useState<Blob | null>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [displayFormats, setDisplayFormats] = useState<Record<string, string[]>>(formatGroups);
  
  const converterRef = useRef<HTMLDivElement>(null);
  const convertedViewRef = useRef<HTMLDivElement>(null);
  const dropzoneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (file) {
      setTimeout(() => {
        converterRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }, [file]);

  useEffect(() => {
    if(isConverted) {
        setTimeout(() => {
            convertedViewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
    }
  }, [isConverted]);

  useEffect(() => {
    let objectUrl: string | null = null;
    if (convertedFileBlob) {
      objectUrl = URL.createObjectURL(convertedFileBlob);
      setPreviewUrl(objectUrl);
    } else if (file) {
      objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    } else {
      setPreviewUrl(null);
    }

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [file, convertedFileBlob]);

  const handleFileChange = (files: FileList | null) => {
    if (files && files.length > 0) {
      const newFile = files[0];
      setFile(newFile);
      setSelectedFormat(null);
      setIsConverted(false);
      setConvertedFileBlob(null);
      setIsFormatDropdownOpen(false);

      const category = getCategoryKey(newFile);
      if (category) {
          const currentFormat = newFile.name.split('.').pop()?.toUpperCase();
          const appropriateFormats = formatGroups[category].filter(
              (format) => format !== currentFormat
          );
          setDisplayFormats({ [category]: appropriateFormats });
      } else {
          // Fallback to all formats if category is unknown
          setDisplayFormats(formatGroups);
      }
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleMouseLeave();
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileChange(e.dataTransfer.files);
  };
  
  const handleRemoveFile = () => {
    setFile(null);
    setIsConverted(false);
    setIsConverting(false);
    setSelectedFormat(null);
    setConvertedFileBlob(null);
    setDisplayFormats(formatGroups); // Reset formats
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!dropzoneRef.current) return;
    const rect = dropzoneRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = (mouseX / width - 0.5);
    const yPct = (mouseY / height - 0.5);
    
    const maxRotation = 8;

    setRotation({
      x: yPct * -maxRotation,
      y: xPct * maxRotation,
    });
  };
  
  const handleMouseLeave = () => {
    setRotation({ x: 0, y: 0 });
  };

  const handleConvert = () => {
    if (!selectedFormat || !file) return;

    const isImageConversion = file.type.startsWith('image/') && imageFormats.has(selectedFormat.toUpperCase());

    if (!isImageConversion) {
        alert("Sorry, only image-to-image conversion is supported in this version. Support for more formats is coming soon!");
        return;
    }

    if (!previewUrl) return;

    setIsConverting(true);

    setTimeout(() => {
        const image = new Image();
        image.src = previewUrl;

        image.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = image.width;
            canvas.height = image.height;
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                alert("Failed to process image. Could not create canvas context.");
                setIsConverting(false);
                return;
            }
            
            if (selectedFormat.toUpperCase() === 'JPG' || selectedFormat.toUpperCase() === 'JPEG') {
                 ctx.fillStyle = 'white';
                 ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            
            ctx.drawImage(image, 0, 0);
            const mimeType = `image/${selectedFormat.toLowerCase()}`;

            canvas.toBlob((blob) => {
                if (blob) {
                    setConvertedFileBlob(blob);
                }
                setIsConverting(false);
                setIsConverted(true);
            }, mimeType, 0.92);
        };
        
        image.onerror = () => {
            alert("Failed to load image for conversion.");
            setIsConverting(false);
        };
    }, 2500);
  };

  const handleDownload = () => {
      if (!convertedFileBlob || !file || !selectedFormat) {
          alert("No converted file available to download.");
          return;
      }
      
      const originalFilename = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      const newFilename = `${originalFilename}.${selectedFormat.toLowerCase()}`;
      
      const url = URL.createObjectURL(convertedFileBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = newFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-6 overflow-x-hidden">
      <header className="w-full max-w-7xl flex justify-between items-center animate-fade-in-down">
        <h1 className="text-2xl font-semibold">MorphIt</h1>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 6H20M4 12H20M4 18H20" stroke="#715959" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center text-center w-full space-y-24 pt-16 pb-24">
        <section className="w-full flex flex-col items-center">
            <div className="w-full animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                <h2 className="text-5xl font-bold mb-4">One tool. Every format you need</h2>
                <p className="text-2xl md:text-3xl max-w-3xl mx-auto">Instantly transform your file. Choose the format and download in a snap.</p>
            </div>

            <div className="mt-16 w-full flex justify-center animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                 <div
                    ref={dropzoneRef}
                    onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}
                    onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}
                    className="relative w-[380px] h-[220px] md:w-[500px] md:h-[260px] rounded-[32px] transition-transform duration-300 ease-out"
                    style={{
                        transformStyle: 'preserve-3d',
                        transform: `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale(${isDragging ? 1.05 : 1})`,
                        boxShadow: isDragging 
                            ? '0 0 25px rgba(113, 89, 89, 0.8), 0 0 50px rgba(113, 89, 89, 0.6)'
                            : '0 0 15px rgba(113, 89, 89, 0.5), 0 0 30px rgba(113, 89, 89, 0.3)',
                    }}
                 >
                    {/* Glass Layer */}
                    <div 
                        className="absolute inset-[1px] rounded-[31px] bg-[#715959]/20 backdrop-blur-xl"
                        style={{ transform: 'translateZ(20px)' }}
                    ></div>
                    
                    {/* Content Layer */}
                    <div
                        className="absolute inset-[1px] rounded-[31px] flex flex-col items-center justify-center cursor-pointer group"
                        onClick={() => document.getElementById('file-upload')?.click()}
                        style={{
                            boxShadow: 'inset 0px 4px 10px rgba(0, 0, 0, 0.5)',
                            transform: 'translateZ(40px)'
                        }}
                    >
                         <div className="transform transition-transform duration-300 ease-out group-hover:scale-110">
                          <UploadIcon />
                        </div>
                        <p className="mt-4 text-xl transition-transform duration-300 ease-out group-hover:scale-110">Drop Here</p>
                        <input type="file" id="file-upload" className="hidden" onChange={(e) => handleFileChange(e.target.files)} accept="*" />
                    </div>
                </div>
            </div>
        </section>

        {file && (
            <section ref={converterRef} className="w-full max-w-lg flex flex-col items-start text-left gap-4 animate-fade-in">
                <div className="flex items-center gap-2 text-xl font-medium">
                    <button onClick={handleRemoveFile} className="p-1 rounded-full hover:bg-white/5 transition-colors">
                        <CloseIcon />
                    </button>
                    <span>{file.name}</span>
                </div>
                
                {isConverting ? (
                     <div className="w-full flex flex-col items-center gap-6">
                        <div className="w-full h-64 bg-[#1c1818] rounded-xl flex items-center justify-center relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
                            <p>Processing...</p>
                        </div>
                    </div>
                ) : isConverted ? (
                     <div ref={convertedViewRef} className="w-full flex flex-col items-center gap-6">
                         <div className="w-full h-64 bg-[#1c1818] rounded-xl flex items-center justify-center p-4">
                            {previewUrl && file.type.startsWith('image/') ? (
                                <img src={previewUrl} alt="File preview" className="max-w-full max-h-full object-contain rounded-lg" />
                            ) : (
                                <p>Preview not available for this file type</p>
                            )}
                        </div>
                        <button
                            onClick={handleDownload}
                            className="w-full bg-gradient-to-br from-[#D98695] to-[#715959] text-[#0E0B0B] font-bold h-14 rounded-xl transition-opacity hover:opacity-90"
                        >
                            Download
                        </button>
                    </div>
                ) : (
                    <div className="w-full flex flex-col sm:flex-row items-center gap-4">
                        <div className="relative w-full sm:w-auto sm:flex-grow">
                            <button onClick={() => setIsFormatDropdownOpen(!isFormatDropdownOpen)} className="w-full bg-[#1c1818] h-14 px-6 rounded-xl flex items-center justify-between transition-colors hover:bg-[#2a2525]">
                                <div className="flex items-center gap-4">
                                    {selectedFormat ? <PlayIcon/> : <ChevronDownIcon />}
                                    <span>{selectedFormat || 'Choose Format'}</span>
                                </div>
                            </button>
                            {isFormatDropdownOpen && (
                                <div className="absolute top-full left-0 mt-2 w-full max-h-60 overflow-y-auto bg-[#1c1818] rounded-xl z-10 p-2 space-y-2">
                                    {Object.entries(displayFormats).map(([groupName, formats]) => (
                                        <div key={groupName}>
                                            <h3 className="px-3 py-1 text-sm font-semibold text-gray-400">{groupName}</h3>
                                            <div className="grid grid-cols-2 gap-2">
                                                {formats.map(format => (
                                                    <button 
                                                        key={format} 
                                                        onClick={() => { setSelectedFormat(format); setIsFormatDropdownOpen(false); }}
                                                        className="p-3 text-center rounded-lg hover:bg-[#2a2525] transition-colors"
                                                    >
                                                        {format}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <button 
                            onClick={handleConvert}
                            disabled={!selectedFormat}
                            className="w-full sm:w-auto bg-gradient-to-br from-[#D98695] to-[#715959] text-[#0E0B0B] font-bold h-14 px-10 rounded-xl transition-opacity disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                        >
                            Convert
                        </button>
                    </div>
                )}
            </section>
        )}
      </main>
    </div>
  );
}

export default App;
