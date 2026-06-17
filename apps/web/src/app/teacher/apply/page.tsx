'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Send, Upload, FileText, X } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function TeacherApplyPage() {
  const [formData, setFormData] = useState({ name: '', email: '', bio: '' });
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      
      // Limit file size to 5MB max
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error('File size exceeds the 5MB maximum limit.');
        return;
      }
      
      setCvFile(selectedFile);
      toast.success(`Attached: ${selectedFile.name}`);
    }
  };

  const removeSelectedFile = () => {
    setCvFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Assemble dynamic structural data fields into standard Multipart Form Payload
      const payload = new FormData();
      payload.append('name', formData.name.trim());
      payload.append('email', formData.email.trim());
      payload.append('bio', formData.bio.trim());
      if (cvFile) {
        payload.append('cv', cvFile);
      }

      const res = await fetch('/api/teacher/apply', {
        method: 'POST',
        // Content-Type header must be omitted when sending FormData so the browser generates the boundary token safely
        body: payload,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');

      toast.success('Application received! Keep an eye on your email inbox! 🚀');
      setFormData({ name: '', email: '', bio: '' });
      removeSelectedFile();
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 font-nunito" style={{ background: 'linear-gradient(135deg, #FAF5FF 0%, #FEF9F0 100%)' }}>
      <div className="w-full max-w-xl space-y-4">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-[#7C3AED] hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to Main Screen
        </Link>
        <Card className="border-4 border-[#C4B5FD] bg-white shadow-xl rounded-3xl overflow-hidden">
          <div className="bg-gradient-to-r from-[#7C3AED] to-[#EC4899] p-6 text-white text-center">
            <span className="text-5xl">👩‍🏫</span>
            <h1 className="text-2xl font-black mt-2">Join EduFlow Instructors</h1>
            <p className="text-xs font-bold text-pink-100">Submit details for administrative verification</p>
          </div>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-black text-[#3B0764] block mb-1">Display Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Prof. Ghada"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-xl border-4 border-[#C4B5FD] p-3 text-sm font-bold bg-[#FAF5FF] focus:outline-none focus:border-[#EC4899]"
                />
              </div>
              
              <div>
                <label className="text-sm font-black text-[#3B0764] block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-xl border-4 border-[#C4B5FD] p-3 text-sm font-bold bg-[#FAF5FF] focus:outline-none focus:border-[#EC4899]"
                />
              </div>

              <div>
                <label className="text-sm font-black text-[#3B0764] block mb-1">Instructor Biography & Skills</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe your qualifications and the subject materials you intend to instruct..."
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full rounded-xl border-4 border-[#C4B5FD] p-3 text-sm font-bold bg-[#FAF5FF] focus:outline-none focus:border-[#EC4899]"
                />
              </div>

              {/* Enhanced File Upload Section Wrapper */}
              <div>
                <label className="text-sm font-black text-[#3B0764] block mb-1">Upload Professional CV / Resume</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  id="cv-upload-input"
                />
                
                {!cvFile ? (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-4 border-dashed border-[#C4B5FD] rounded-xl p-6 flex flex-col items-center justify-center bg-[#FAF5FF] cursor-pointer hover:bg-[#F3E8FF] hover:border-[#7C3AED] transition-all group"
                  >
                    <Upload className="h-8 w-8 text-[#7C3AED] group-hover:scale-110 transition-transform mb-2" />
                    <span className="text-sm font-black text-[#3B0764]">Click to browse documents</span>
                    <span className="text-xs font-bold text-[#7E22CE] mt-0.5">Supports PDF, DOC, DOCX up to 5MB</span>
                  </div>
                ) : (
                  <div className="w-full border-4 border-[#7C3AED] rounded-xl p-4 flex items-center justify-between bg-[#F3E8FF]">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-[#7C3AED] rounded-lg flex items-center justify-center text-white">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="max-w-[280px] sm:max-w-[360px]">
                        <p className="text-sm font-black text-[#3B0764] truncate">{cvFile.name}</p>
                        <p className="text-xs font-bold text-[#7E22CE]">{(cvFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={removeSelectedFile}
                      className="p-1.5 hover:bg-white/50 rounded-full text-[#EC4899] transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full rounded-full bg-[#7C3AED] text-white font-black py-4 shadow-md hover:bg-[#6D28D9] mt-2">
                <Send className="h-4 w-4 mr-2" /> {isSubmitting ? 'Submitting Application...' : 'Send Application Form!'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}