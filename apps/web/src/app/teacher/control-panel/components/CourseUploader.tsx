'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Video, FileText, DollarSign } from 'lucide-react';

export default function CourseUploader() {
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    // We will add the API call logic here once we build the database table
    setTimeout(() => setIsUploading(false), 2000); // Simulated delay
  };

  return (
    <form onSubmit={handleUpload} className="space-y-6 bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
      <h3 className="text-xl font-bold text-[#3B0764]">Upload New Content</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Course Title */}
        <div className="space-y-2">
          <label className="text-xs font-black uppercase">Course Title</label>
          <input className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none" placeholder="e.g. Advanced Mathematics" />
        </div>

        {/* Pricing */}
        <div className="space-y-2">
          <label className="text-xs font-black uppercase">Price (0 for Free)</label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
            <input type="number" className="w-full pl-9 p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none" placeholder="0.00" />
          </div>
        </div>
      </div>

      {/* File Upload Area */}
      <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-[#7C3AED] transition-colors">
        <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
        <p className="text-sm font-bold">Drag & drop video or document</p>
        <input type="file" className="hidden" id="file-upload" />
        <label htmlFor="file-upload" className="text-xs text-[#7C3AED] font-bold cursor-pointer">Browse Files</label>
      </div>

      <Button type="submit" className="w-full bg-[#7C3AED] py-6 rounded-xl font-bold" disabled={isUploading}>
        {isUploading ? 'Uploading to Server...' : 'Publish Course Content'}
      </Button>
    </form>
  );
}