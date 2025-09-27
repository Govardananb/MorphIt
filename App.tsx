import React, { useState, useRef, useEffect } from 'react';

// Declare external libraries loaded via CDN
declare const jspdf: any;
declare const pdfjsLib: any;
declare const mammoth: any;
declare const html2canvas: any;
declare const lamejs: any;

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
  "Image": ["JPG", "PNG", "WEBP", "GIF", "PDF"],
  "Document": ["PDF", "DOCX", "TXT", "JPG", "PNG"],
  "Audio": ["MP3", "WAV"],
  "Video": ["MP4", "WEBM"],
  "Archive": ["ZIP"],
};

const imageFormats = new Set(["JPG", "PNG", "WEBP", "GIF"]);

const getCategoryKey = (file: File): keyof typeof formatGroups | null => {
    const mime = file.type;
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
  
    if (mime.startsWith('image/')) return 'Image';
    if (ext === 'pdf' || mime === 'application/pdf') return 'Document';
    if (ext === 'docx' || mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'Document';
    if (ext === 'txt' || mime === 'text/plain') return 'Document';
    if (mime.startsWith('audio/')) return 'Audio';
    if (mime.startsWith('video/')) return 'Video';
    if (['zip', '7z'].includes(ext) || mime === 'application/zip') return 'Archive';
  
    return null;
};

// --- CONVERSION HELPERS ---

const convertImage = (inputFile: File, targetFormat: string): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const image = new Image();
        const objectUrl = URL.createObjectURL(inputFile);
        image.src = objectUrl;

        image.onload = () => {
            try {
                if (targetFormat === 'pdf') {
                    const { jsPDF } = jspdf;
                    const doc = new jsPDF({
                        orientation: image.width > image.height ? 'landscape' : 'portrait',
                        unit: 'px',
                        format: [image.width, image.height]
                    });
                    doc.addImage(image, 'PNG', 0, 0, image.width, image.height);
                    resolve(doc.output('blob'));
                } else {
                    const canvas = document.createElement('canvas');
                    canvas.width = image.width;
                    canvas.height = image.height;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) throw new Error("Could not get canvas context");

                    if (targetFormat === 'jpg' || targetFormat === 'jpeg') {
                        ctx.fillStyle = 'white';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                    }
                    ctx.drawImage(image, 0, 0);
                    const mimeType = `image/${targetFormat}`;
                    canvas.toBlob((blob) => {
                        if (blob) resolve(blob);
                        else reject(new Error("Canvas toBlob failed"));
                    }, mimeType, 0.92);
                }
            } finally {
                URL.revokeObjectURL(objectUrl);
            }
        };
        image.onerror = (err) => {
            URL.revokeObjectURL(objectUrl);
            reject(err);
        };
    });
};

const convertPdf = (inputFile: File, targetFormat: string): Promise<Blob> => {
    return new Promise(async (resolve, reject) => {
        if (!imageFormats.has(targetFormat.toUpperCase())) {
            return reject(new Error(`PDF to ${targetFormat} conversion not supported.`));
        }
        try {
            const fileBuffer = await inputFile.arrayBuffer();
            const pdf = await pdfjsLib.getDocument(fileBuffer).promise;
            const page = await pdf.getPage(1); // Only convert first page for simplicity
            const viewport = page.getViewport({ scale: 1.5 });

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            if (!context) throw new Error("Could not get canvas context");

            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({ canvasContext: context, viewport: viewport }).promise;
            const mimeType = `image/${targetFormat.toLowerCase()}`;
            canvas.toBlob((blob) => {
                if (blob) resolve(blob);
                else reject(new Error("Canvas toBlob failed for PDF conversion"));
            }, mimeType, 0.92);
        } catch (error) {
            reject(error);
        }
    });
};

const convertDocx = (inputFile: File, targetFormat: string): Promise<Blob> => {
    return new Promise(async (resolve, reject) => {
        try {
            const arrayBuffer = await inputFile.arrayBuffer();
            if (targetFormat === 'pdf') {
                const { value: html } = await mammoth.convertToHtml({ arrayBuffer });
                
                const element = document.createElement('div');
                element.innerHTML = html;
                element.style.position = 'absolute';
                element.style.left = '-9999px';
                element.style.width = '800px';
                document.body.appendChild(element);

                const { jsPDF } = jspdf;
                const doc = new jsPDF('p', 'pt', 'a4');
                doc.html(element, {
                    callback: function (doc) {
                        document.body.removeChild(element);
                        resolve(doc.output('blob'));
                    },
                    x: 10,
                    y: 10,
                    html2canvas: { scale: 0.7 }
                });
            } else if (targetFormat === 'txt') {
                const { value } = await mammoth.extractRawText({ arrayBuffer });
                resolve(new Blob([value], { type: 'text/plain' }));
            } else {
                reject(new Error(`DOCX to ${targetFormat} conversion not supported.`));
            }
        } catch (error) {
            reject(error);
        }
    });
};

const audioBufferToWav = (buffer: AudioBuffer): Blob => {
    const numOfChan = buffer.numberOfChannels,
        len = buffer.length * numOfChan * 2 + 44,
        arrBuffer = new ArrayBuffer(len),
        view = new DataView(arrBuffer),
        chans = [];
    let i, sample, offset = 0, pos = 0;

    setUint32(0x46464952); // "RIFF"
    setUint32(len - 8); // file length - 8
    setUint32(0x45564157); // "WAVE"
    setUint32(0x20746d66); // "fmt " chunk
    setUint32(16); // length = 16
    setUint16(1); // PCM (uncompressed)
    setUint16(numOfChan);
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * 2 * numOfChan); // byte rate
    setUint16(numOfChan * 2); // block align
    setUint16(16); // bits per sample
    setUint32(0x61746164); // "data" - chunk
    setUint32(len - pos - 4); // chunk length

    for (i = 0; i < buffer.numberOfChannels; i++) chans.push(buffer.getChannelData(i));

    while (pos < len) {
        for (i = 0; i < numOfChan; i++) {
            sample = Math.max(-1, Math.min(1, chans[i][offset]));
            sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
            view.setInt16(pos, sample, true);
            pos += 2;
        }
        offset++;
    }

    return new Blob([view], { type: "audio/wav" });

    function setUint16(data) { view.setUint16(pos, data, true); pos += 2; }
    function setUint32(data) { view.setUint32(pos, data, true); pos += 4; }
};


const convertAudio = (inputFile: File, targetFormat: string): Promise<Blob> => {
    return new Promise(async (resolve, reject) => {
        try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const arrayBuffer = await inputFile.arrayBuffer();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

            if (targetFormat === 'wav') {
                resolve(audioBufferToWav(audioBuffer));
            } else if (targetFormat === 'mp3') {
                const channels = audioBuffer.numberOfChannels;
                const sampleRate = audioBuffer.sampleRate;
                const mp3encoder = new lamejs.Mp3Encoder(channels, sampleRate, 128); // 128kbps

                const convertFloat32ToInt16 = (buffer: Float32Array): Int16Array => {
                    let l = buffer.length;
                    const buf = new Int16Array(l);
                    while (l--) buf[l] = Math.min(1, buffer[l]) * 32767;
                    return buf;
                };

                const left = convertFloat32ToInt16(audioBuffer.getChannelData(0));
                const right = channels > 1 ? convertFloat32ToInt16(audioBuffer.getChannelData(1)) : null;
                const mp3Data = [];
                const sampleBlockSize = 1152;

                for (let i = 0; i < left.length; i += sampleBlockSize) {
                    const leftChunk = left.subarray(i, i + sampleBlockSize);
                    let mp3buf;
                    if (right) {
                        const rightChunk = right.subarray(i, i + sampleBlockSize);
                        mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
                    } else {
                        mp3buf = mp3encoder.encodeBuffer(leftChunk);
                    }
                    if (mp3buf.length > 0) mp3Data.push(new Int8Array(mp3buf));
                }
                const mp3buf = mp3encoder.flush();
                if (mp3buf.length > 0) mp3Data.push(new Int8Array(mp3buf));

                resolve(new Blob(mp3Data, { type: 'audio/mp3' }));
            } else {
                reject(new Error(`Audio to ${targetFormat} conversion not supported.`));
            }
        } catch (error) {
            reject(error);
        }
    });
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
          // Fallback for unknown file types
          const allFormats = { ...formatGroups };
          delete allFormats['Archive']; // Don't show archive as a conversion option for unknown types
          setDisplayFormats(allFormats);
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
        const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
        const targetFormat = selectedFormat.toLowerCase();

        try {
            let blob: Blob | null = null;
            const fileCategory = getCategoryKey(file);

            if (fileCategory === 'Image') {
                blob = await convertImage(file, targetFormat);
            } else if (fileCategory === 'Document') {
                if(fileExtension === 'pdf') {
                    blob = await convertPdf(file, targetFormat);
                } else if (fileExtension === 'docx') {
                    blob = await convertDocx(file, targetFormat);
                } else {
                     throw new Error(`Conversion from .${fileExtension} is not supported yet.`);
                }
            } else if (fileCategory === 'Audio') {
                blob = await convertAudio(file, targetFormat);
            } else {
                console.warn(`Conversion for ${file.type} is not fully supported. A mock conversion will be performed.`);
                blob = new Blob([file], { type: file.type });
            }
            
            if (blob) {
                setConvertedFileBlob(blob);
                setIsConverted(true);
            } else {
                throw new Error("Conversion resulted in an empty file.");
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error("Conversion failed:", errorMessage);
            alert(`An error occurred during conversion: ${errorMessage}`);
            setIsConverted(false);
        } finally {
            setIsConverting(false);
        }
    }, 200);
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
  
  const handleConvertAgain = () => {
    setIsConverted(false);
    setConvertedFileBlob(null);
    setSelectedFormat(null);
    setTimeout(() => {
        converterRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
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
                        <div className="w-full flex flex-col sm:flex-row items-center gap-4">
                            <button
                                onClick={handleDownload}
                                className="w-full flex-1 bg-[#D98695] text-white dark:bg-[#FFCECE] dark:text-[#0E0B0B] font-bold h-14 rounded-xl transition-opacity hover:opacity-90"
                            >
                                Download
                            </button>
                            <button
                                onClick={handleConvertAgain}
                                className="w-full flex-1 bg-transparent border border-[#D98695] dark:border-[#FFCECE] text-[#5B4A4A] dark:text-[#FFCECE] font-bold h-14 rounded-xl transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                            >
                                Convert Again
                            </button>
                        </div>
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
                                    {Object.keys(displayFormats).length === 0 ? (
                                        <p className="px-3 py-2 text-gray-500">No conversions available for this file type.</p>
                                    ) : (
                                        Object.keys(displayFormats).map((groupName) => (
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
                                        ))
                                    )}
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
