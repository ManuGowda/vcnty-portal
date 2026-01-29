import { useState } from 'react';
import { X, Upload, Download, AlertTriangle, CheckCircle2, Loader2, FileSpreadsheet } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { api } from '@/lib/api';
import { supabase } from '@/lib/supabase';

const REQUIRED_SCHEMA = [
    'title',
    'short_desc',
    'full_description',
    'price',
    'currency',
    'stock_qty',
    'sku',
    'category',
    'tags',
    'main_image_url',
    'status'
] as const;

type SchemaKey = typeof REQUIRED_SCHEMA[number];

const normalize = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]/g, '');

const FUZZY_MAP: Record<string, SchemaKey> = {
    'itemname': 'title',
    'productname': 'title',
    'name': 'title',
    'shortdescription': 'short_desc',
    'shortdesc': 'short_desc',
    'summary': 'short_desc',
    'productdescription': 'full_description',
    'description': 'full_description',
    'longdescription': 'full_description',
    'fulldescription': 'full_description',
    'cost': 'price',
    'amount': 'price',
    'stock': 'stock_qty',
    'quantity': 'stock_qty',
    'qty': 'stock_qty',
    'stockqty': 'stock_qty',
    'image': 'main_image_url',
    'imageurl': 'main_image_url',
    'mainimageurl': 'main_image_url',
    'photo': 'main_image_url',
};

const sanitize = (val: unknown) => {
    if (typeof val !== 'string') return String(val || '');
    let clean = val.trim();
    // Strip surrounding quotes if present (common in messy CSVs with leading spaces)
    if (clean.startsWith('"') && clean.endsWith('"')) {
        clean = clean.substring(1, clean.length - 1).trim();
    }
    // Strip leading =, +, -, @ to prevent injection
    return clean.replace(/^[=+\-@]+/, '');
};

interface CSVBulkUploadProps {
    storeId: string;
    storeLocation: { latitude: number, longitude: number };
    onClose: () => void;
    onSuccess: () => void;
}

export default function CSVBulkUpload({ storeId, storeLocation, onClose, onSuccess }: CSVBulkUploadProps) {
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [results, setResults] = useState<{
        total: number;
        success: number;
        failed: number;
        errors: string[];
    } | null>(null);

    const downloadTemplate = () => {
        const headers = ['Title', 'Short_Desc', 'Full_Description', 'Price', 'Currency', 'Stock_Qty', 'SKU', 'Category', 'Tags', 'Main_Image_URL', 'Status'];
        const csvContent = "data:text/csv;charset=utf-8," + headers.join(",");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "vcnty_items_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            // Memory protection: Limit to 10MB
            if (selectedFile.size > 10 * 1024 * 1024) {
                alert("File too large. Please upload less than 10MB.");
                return;
            }
            setFile(selectedFile);
            setResults(null);
        }
    };

    const processImport = async () => {
        if (!file) return;
        setIsProcessing(true);
        setResults(null);

        const session = await supabase.auth.getSession();
        const token = session.data.session?.access_token;

        const mapHeaders = (rawData: Record<string, unknown>[]) => {
            if (rawData.length === 0) return [];
            const firstRow = rawData[0];
            const userHeaders = Object.keys(firstRow);
            const mapping: Record<string, SchemaKey | null> = {};

            userHeaders.forEach(header => {
                const normalized = normalize(header);
                // Check if any REQUIRED_SCHEMA key normalized matches this normalized header
                const schemaMatch = REQUIRED_SCHEMA.find(key => normalize(key) === normalized);

                if (schemaMatch) {
                    mapping[header] = schemaMatch;
                } else {
                    // Try Fuzzy match
                    mapping[header] = FUZZY_MAP[normalized] || null;
                }
            });

            return rawData.map(row => {
                const newRow: Record<string, unknown> = {};
                Object.entries(row).forEach(([key, val]) => {
                    const schemaKey = mapping[key];
                    if (schemaKey) newRow[schemaKey] = val;
                });
                return newRow;
            });
        };

        const validateRow = (row: Record<string, unknown>, index: number) => {
            const rowErrors: string[] = [];

            // Price validation
            let price = 0;
            if (row['price']) {
                const cleanPrice = String(row['price']).replace(/[^0-9.]/g, '');
                price = parseFloat(cleanPrice);
                if (isNaN(price) || price < 0) {
                    rowErrors.push(`Row ${index}: Invalid price format.`);
                    price = 0;
                }
            }

            // Stock validation
            let stock = 0;
            if (row['stock_qty']) {
                stock = parseInt(String(row['stock_qty']).replace(/[^0-9]/g, ''));
                if (isNaN(stock)) stock = 0;
            }

            // Image validation
            const imageUrl = sanitize(row['main_image_url']);
            if (imageUrl && !imageUrl.toLowerCase().startsWith('https://')) {
                rowErrors.push(`Row ${index}: Image URL must be secure (https://).`);
            }

            // Sanitization
            const title = sanitize(row['title']);
            if (!title) rowErrors.push(`Row ${index}: Missing Title.`);

            const category = sanitize(row['category']);
            if (!category) rowErrors.push(`Row ${index}: Missing Category.`);

            // Tags processing
            const tags = String(row['tags'] || '').split(',').map(t => t.trim()).filter(Boolean);

            // Status mapping
            let status = 'AVAILABLE';
            const rowStatus = String(row['status'] || '');
            if (rowStatus && rowStatus.toLowerCase() === 'published') {
                status = 'AVAILABLE';
            } else if (rowStatus) {
                status = rowStatus.toUpperCase();
            }

            return {
                data: {
                    title,
                    description: sanitize(row['full_description'] || row['description'] || ''),
                    shortDescription: sanitize(row['short_desc'] || ''),
                    sku: sanitize(row['sku'] || ''),
                    price,
                    currency: sanitize(row['currency'] || 'EUR'),
                    quantity: stock,
                    category,
                    tags,
                    status,
                    images: imageUrl ? [imageUrl] : [],
                    latitude: storeLocation.latitude,
                    longitude: storeLocation.longitude,
                },
                errors: rowErrors
            };
        };

        const handleData = async (rawData: unknown[]) => {
            const normalizedData = mapHeaders(rawData as Record<string, unknown>[]);
            const itemsToUpload: Record<string, unknown>[] = [];
            const errors: string[] = [];
            let failedCount = 0;

            normalizedData.forEach((row, i) => {
                const { data, errors: rowErrors } = validateRow(row, i + 1);
                if (rowErrors.length > 0) {
                    failedCount++;
                    errors.push(...rowErrors);
                } else {
                    itemsToUpload.push(data);
                }
            });

            if (itemsToUpload.length > 0) {
                try {
                    await api.post('/items/batch', {
                        storeId,
                        items: itemsToUpload
                    }, token);

                    setResults({
                        total: rawData.length,
                        success: itemsToUpload.length,
                        failed: failedCount,
                        errors
                    });
                    onSuccess();
                } catch (err) {
                    setResults({
                        total: rawData.length,
                        success: 0,
                        failed: rawData.length,
                        errors: [...errors, `Network Error: ${err instanceof Error ? err.message : 'Unknown'}`]
                    });
                }
            } else {
                setResults({
                    total: rawData.length,
                    success: 0,
                    failed: failedCount,
                    errors
                });
            }
            setIsProcessing(false);
        };

        if (file.name.endsWith('.csv')) {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: 'greedy',
                complete: (results) => handleData(results.data)
            });
        } else {
            const reader = new FileReader();
            reader.onload = (e) => {
                const ab = e.target?.result;
                const wb = XLSX.read(ab, { type: 'array' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);
                handleData(data);
            };
            reader.readAsArrayBuffer(file);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6 backdrop-blur-sm">
            <div className="bg-white border-4 border-black w-full max-w-2xl shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] flex flex-col max-h-[90vh]">
                <div className="p-6 border-b-4 border-black flex items-center justify-between">
                    <h2 className="text-2xl font-black uppercase tracking-tighter">Bulk Item Import</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-8 space-y-8 overflow-y-auto">
                    {!results ? (
                        <>
                            <div className="bg-blue-50 border-4 border-blue-200 p-6 flex items-start gap-4">
                                <Download className="text-blue-500 shrink-0 mt-1" />
                                <div className="space-y-2">
                                    <h4 className="font-bold uppercase tracking-tight text-blue-900 text-sm">Template Required</h4>
                                    <p className="text-xs text-blue-800 leading-relaxed">
                                        Use our updated standard CSV structure. Items will be automatically located at your store&apos;s coordinates.
                                    </p>
                                    <button
                                        onClick={downloadTemplate}
                                        className="text-xs font-black uppercase underline hover:text-blue-600"
                                    >
                                        Get Template (CSV)
                                    </button>
                                </div>
                            </div>

                            <div
                                className={`border-4 border-dashed border-slate-200 p-12 text-center transition-colors ${file ? 'bg-green-50 border-green-500' : 'hover:border-black'}`}
                            >
                                <input
                                    type="file"
                                    accept=".csv,.xlsx"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                    id="csv-upload"
                                />
                                <label htmlFor="csv-upload" className="cursor-pointer space-y-4">
                                    <div className="w-16 h-16 bg-slate-100 border-2 border-dashed border-slate-400 flex items-center justify-center mx-auto">
                                        {file?.name.endsWith('.xlsx') ? (
                                            <FileSpreadsheet className="text-green-600" />
                                        ) : (
                                            <Upload className="text-slate-400" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-bold text-lg">{file ? file.name : 'Select Item Manifest'}</p>
                                        <p className="text-xs text-slate-500 mt-1 italic">CSV or XLSX supported (Max 10MB)</p>
                                    </div>
                                </label>
                            </div>

                            {file && (
                                <button
                                    onClick={processImport}
                                    disabled={isProcessing}
                                    className="w-full bg-black text-white py-5 font-black uppercase tracking-[0.2em] text-sm flex items-center justify-center space-x-3 hover:bg-gray-800 disabled:bg-gray-400 transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1"
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="animate-spin" size={20} />
                                            <span>Processing Manifest...</span>
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 size={20} />
                                            <span>Confirm & Upload Catalog</span>
                                        </>
                                    )}
                                </button>
                            )}
                        </>
                    ) : (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-white p-4 border-4 border-black text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                    <span className="block text-[10px] uppercase font-black text-gray-500 mb-1">Total</span>
                                    <span className="text-3xl font-black">{results.total}</span>
                                </div>
                                <div className="bg-green-50 p-4 border-4 border-green-600 text-center shadow-[4px_4px_0px_0px_rgba(22,163,74,1)]">
                                    <span className="block text-[10px] uppercase font-black text-green-700 mb-1">Success</span>
                                    <span className="text-3xl font-black text-green-700">{results.success}</span>
                                </div>
                                <div className="bg-red-50 p-4 border-4 border-red-600 text-center shadow-[4px_4px_0px_0px_rgba(220,38,38,1)]">
                                    <span className="block text-[10px] uppercase font-black text-red-700 mb-1">Failed</span>
                                    <span className="text-3xl font-black text-red-700">{results.failed}</span>
                                </div>
                            </div>

                            {results.errors.length > 0 && (
                                <div className="border-4 border-black p-6 bg-red-50">
                                    <div className="flex items-center gap-2 mb-4 text-red-600">
                                        <AlertTriangle size={20} />
                                        <h4 className="font-black uppercase tracking-tighter text-sm">Import Error Log</h4>
                                    </div>
                                    <div className="max-h-40 overflow-y-auto space-y-1">
                                        {results.errors.map((err, i) => (
                                            <p key={i} className="text-[10px] font-mono text-red-700 leading-tight">[{i + 1}] {err}</p>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col gap-4">
                                {results.success > 0 && (
                                    <p className="text-xs font-bold text-center text-green-600 uppercase italic animate-bounce">
                                        Successfully listed {results.success} items in VCNTY! 🚀
                                    </p>
                                )}
                                <button
                                    onClick={onClose}
                                    className="w-full bg-black text-white py-5 font-black uppercase tracking-[0.2em] text-sm hover:bg-gray-800 transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1"
                                >
                                    Finish & Return
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
