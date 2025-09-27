import React, { useState, useRef, useEffect } from 'react';

// Declare external libraries loaded via CDN
declare const jspdf: any;
declare const pdfjsLib: any;

// SVG Icons
const UploadIcon = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="transition-transform duration-300 ease-out">
    <path d="M14 26L24 16L34 26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M24 16V34" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M40 32V38C40 39.1046 39.1046 40 38 40H10C8.89543 40 8 39.1046 8 38V32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CloseIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const ChevronDownIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const PlayIcon = () => (
     <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5 3L19 12L5 21V3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const ThemeToggle = ({ theme, setTheme }: { theme: string, setTheme: (theme: string) => void }) => {
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };
  
  const SunIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#5B4A4A]"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
  );

  const MoonIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#FFCECE]"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
  );

  return (
    <button onClick={toggleTheme} className="w-14 h-8 rounded-full bg-white/50 dark:bg-black/20 p-1 flex items-center transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D98695] dark:focus:ring-offset-black">
      <div className={`w-6 h-6 rounded-full bg-white dark:bg-[#2a2525] flex items-center justify-center transform transition-transform duration-300 ${theme === 'dark' ? 'translate-x-6' : 'translate-x-0'}`}>
        {theme === 'dark' ? <MoonIcon /> : <SunIcon />}
      </div>
    </button>
  );
};


const formatGroups = {
  "Image": ["JPG", "PNG", "WEBP", "GIF", "SVG", "PDF"],
  "Document": ["PDF", "DOCX", "TXT", "JPG", "PNG"],
  "Audio": ["MP3", "WAV", "FLAC"],
  "Video": ["MP4", "MOV", "MKV"],
  "Archive": ["ZIP", "7Z"],
};

const imageFormats = new Set(["JPG", "PNG", "WEBP", "GIF", "SVG"]);

const getCategoryKey = (file: File): keyof typeof formatGroups | null => {
    const mime = file.type;
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
  
    if (mime.startsWith('image/')) return 'Image';
    if (['pdf', 'docx', 'txt'].includes(ext) || mime === 'application/pdf') return 'Document';
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
  const [theme, setTheme] = useState('dark');
  
  const converterRef = useRef<HTMLDivElement>(null);
  const convertedViewRef = useRef<HTMLDivElement>(null);
  const dropzoneRef = useRef<HTMLDivElement>(null);

   useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

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
      if (convertedFileBlob.type.startsWith('image/')) {
        objectUrl = URL.createObjectURL(convertedFileBlob);
        setPreviewUrl(objectUrl);
      } else {
        setPreviewUrl(null);
      }
    } else if (file) {
      if(file.type.startsWith('image/')) {
        objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);
      } else {
         setPreviewUrl(null);
      }
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
    setDisplayFormats(formatGroups);
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

  const handleConvert = async () => {
    if (!selectedFormat || !file) return;

    setIsConverting(true);
    
    setTimeout(async () => {
        const isImageToFile = file.type.startsWith('image/');
        const isPdfToFile = file.type === 'application/pdf';

        if (isImageToFile && selectedFormat.toUpperCase() === 'PDF') {
            const image = new Image();
            image.src = URL.createObjectURL(file);
            image.onload = () => {
                const { jsPDF } = jspdf;
                const doc = new jsPDF({
                    orientation: image.width > image.height ? 'landscape' : 'portrait',
                    unit: 'px',
                    format: [image.width, image.height]
                });
                doc.addImage(image, 'PNG', 0, 0, image.width, image.height);
                const pdfBlob = doc.output('blob');
                setConvertedFileBlob(pdfBlob);
                setIsConverting(false);
                setIsConverted(true);
                URL.revokeObjectURL(image.src);
            };
            return;
        }

        if (isPdfToFile && imageFormats.has(selectedFormat.toUpperCase())) {
            try {
                const fileBuffer = await file.arrayBuffer();
                const pdf = await pdfjsLib.getDocument(fileBuffer).promise;
                const page = await pdf.getPage(1);
                const viewport = page.getViewport({ scale: 1.5 });

                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                await page.render({ canvasContext: context, viewport: viewport }).promise;

                const mimeType = `image/${selectedFormat.toLowerCase()}`;
                canvas.toBlob((blob) => {
                    if (blob) {
                        setConvertedFileBlob(blob);
                    }
                    setIsConverting(false);
                    setIsConverted(true);
                }, mimeType, 0.92);

            } catch(error) {
                console.error("Error converting PDF to image:", error);
                alert("Failed to convert PDF to image.");
                setIsConverting(false);
            }
            return;
        }

        if (isImageToFile && imageFormats.has(selectedFormat.toUpperCase())) {
            const image = new Image();
            image.src = URL.createObjectURL(file);
            image.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = image.width;
                canvas.height = image.height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    setIsConverting(false); return;
                }
                if (selectedFormat.toUpperCase() === 'JPG' || selectedFormat.toUpperCase() === 'JPEG') {
                     ctx.fillStyle = 'white';
                     ctx.fillRect(0, 0, canvas.width, canvas.height);
                }
                ctx.drawImage(image, 0, 0);
                const mimeType = `image/${selectedFormat.toLowerCase()}`;
                canvas.toBlob((blob) => {
                    if (blob) setConvertedFileBlob(blob);
                    setIsConverting(false);
                    setIsConverted(true);
                    URL.revokeObjectURL(image.src);
                }, mimeType, 0.92);
            };
            return;
        }
        
        const newBlob = new Blob([file], { type: file.type });
        setConvertedFileBlob(newBlob);
        setIsConverting(false);
        setIsConverted(true);

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

  const shadowColor = theme === 'dark' ? 'rgba(255, 206, 206, 0.3)' : 'rgba(91, 74, 74, 0.15)';
  const shadowColorHover = theme === 'dark' ? 'rgba(255, 206, 206, 0.4)' : 'rgba(91, 74, 74, 0.2)';

  const dropzoneStyle = {
      transformStyle: 'preserve-3d' as const,
      transform: `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale(${isDragging ? 1.05 : 1})`,
      boxShadow: isDragging 
          ? `0 0 25px ${shadowColorHover}, 0 0 50px ${shadowColorHover}`
          : `0 0 15px ${shadowColor}, 0 0 30px ${shadowColor}`,
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-6 overflow-x-hidden text-[#5B4A4A] dark:text-[#FFCECE]">
      <header className="w-full max-w-7xl flex justify-between items-center animate-fade-in-down">
        <h1 className="text-2xl font-semibold">MorphIt</h1>
        <ThemeToggle theme={theme} setTheme={setTheme} />
      </header>

      <main className="flex-grow flex flex-col items-center justify-center text-center w-full space-y-24 pt-24 pb-32">
        <section className="w-full flex flex-col items-center">
            <div className="w-full animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                <h2 className="text-5xl font-bold mb-4">One tool. Every format you need</h2>
                <p className="text-2xl md:text-3xl max-w-3xl mx-auto">Instantly transform your file. Choose the format and download in a snap.</p>
            </div>

            <div className="mt-24 w-full flex justify-center animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                 <div
                    ref={dropzoneRef}
                    onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}
                    onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}
                    className="relative w-[380px] h-[220px] md:w-[500px] md:h-[260px] rounded-[32px] transition-transform duration-300 ease-out"
                    style={dropzoneStyle}
                 >
                    <div 
                        className="absolute inset-[1px] rounded-[31px] bg-[#5B4A4A]/5 dark:bg-[#FFCECE]/10 backdrop-blur-xl"
                        style={{ transform: 'translateZ(20px)' }}
                    ></div>
                    
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
                    <button onClick={handleRemoveFile} className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                        <CloseIcon />
                    </button>
                    <span>{file.name}</span>
                </div>
                
                {isConverting ? (
                     <div className="w-full flex flex-col items-center gap-6">
                        <div className="w-full h-64 bg-white dark:bg-[#1c1818] rounded-xl flex items-center justify-center relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-black/5 dark:via-white/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
                            <p>Processing...</p>
                        </div>
                    </div>
                ) : isConverted ? (
                     <div ref={convertedViewRef} className="w-full flex flex-col items-center gap-6">
                         <div className="w-full h-64 bg-white dark:bg-[#1c1818] rounded-xl flex items-center justify-center p-4">
                            {previewUrl ? (
                                <img src={previewUrl} alt="File preview" className="max-w-full max-h-full object-contain rounded-lg" />
                            ) : (
                                <p>Preview not available for this file type</p>
                            )}
                        </div>
                        <button
                            onClick={handleDownload}
                            className="w-full bg-[#D98695] text-white dark:bg-[#FFCECE] dark:text-[#0E0B0B] font-bold h-14 rounded-xl transition-opacity hover:opacity-90"
                        >
                            Download
                        </button>
                    </div>
                ) : (
                    <div className="w-full flex flex-col sm:flex-row items-center gap-4">
                        <div className="relative w-full sm:w-auto sm:flex-grow">
                            <button onClick={() => setIsFormatDropdownOpen(!isFormatDropdownOpen)} className="w-full bg-white dark:bg-[#1c1818] h-14 px-6 rounded-xl flex items-center justify-between transition-colors hover:bg-gray-50 dark:hover:bg-[#2a2525]">
                                <div className="flex items-center gap-4">
                                    {selectedFormat ? <PlayIcon/> : <ChevronDownIcon />}
                                    <span>{selectedFormat || 'Choose Format'}</span>
                                </div>
                            </button>
                            {isFormatDropdownOpen && (
                                <div className="absolute top-full left-0 mt-2 w-full max-h-60 overflow-y-auto bg-white dark:bg-[#1c1818] rounded-xl z-10 p-2 space-y-2 animate-fade-in-up">
                                    {/* FIX: Replaced Object.entries with Object.keys for better type inference, resolving an error where `formats.map` would fail. */}
                                    {Object.keys(displayFormats).map((groupName) => (
                                        <div key={groupName}>
                                            <h3 className="px-3 py-1 text-sm font-semibold text-gray-500 dark:text-gray-400">{groupName}</h3>
                                            <div className="grid grid-cols-2 gap-2">
                                                {displayFormats[groupName].map(format => (
                                                    <button 
                                                        key={format} 
                                                        onClick={() => { setSelectedFormat(format); setIsFormatDropdownOpen(false); }}
                                                        className="p-3 text-center rounded-lg hover:bg-gray-50 dark:hover:bg-[#2a2525] transition-colors"
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
                            className="w-full sm:w-auto bg-[#D98695] text-white dark:bg-[#FFCECE] dark:text-[#0E0B0B] font-bold h-14 px-10 rounded-xl transition-opacity disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
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