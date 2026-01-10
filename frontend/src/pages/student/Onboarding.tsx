import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { StudentLayout } from "@/components/layouts/StudentLayout";
import { Button } from "@/components/ui/button";
import {
  GraduationCap,
  Github,
  Briefcase,
  FileText,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Upload,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  { id: 1, title: "Academic Details", icon: GraduationCap },
  { id: 2, title: "GitHub Profile", icon: Github },
  { id: 3, title: "Work Experience", icon: Briefcase },
  { id: 4, title: "Resume & Documents", icon: FileText },
];

export default function StudentOnboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Academic
    collegeName: "",
    degree: "",
    branch: "",
    graduationYear: "",
    cgpa: "",
    // GitHub
    githubUsername: "",
    // Work
    internships: [] as { company: string; role: string; duration: string }[],
    // Documents
    resume: null as File | null,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!validTypes.includes(file.type)) {
        alert('Please upload a PDF or DOC file');
        return;
      }
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      setFormData({ ...formData, resume: file });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      // Validate and set file
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!validTypes.includes(file.type)) {
        alert('Please upload a PDF or DOC file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      setFormData({ ...formData, resume: file });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const removeFile = () => {
    setFormData({ ...formData, resume: null });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <StudentLayout>
      <div className="max-w-3xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                      currentStep === step.id
                        ? "bg-credora-emerald text-accent-foreground"
                        : currentStep > step.id
                        ? "bg-credora-emerald/20 text-credora-emerald"
                        : "bg-secondary text-muted-foreground"
                    )}
                  >
                    {currentStep > step.id ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <step.icon className="w-6 h-6" />
                    )}
                  </div>
                  <span className="text-xs mt-2 text-muted-foreground hidden sm:block">
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "w-full h-1 mx-2 rounded-full transition-all",
                      currentStep > step.id ? "bg-credora-emerald" : "bg-secondary"
                    )}
                    style={{ minWidth: "40px" }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-card rounded-2xl border border-border p-8"
        >
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-2">Academic Details</h2>
                <p className="text-muted-foreground text-sm">
                  Tell us about your educational background
                </p>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    College/University Name
                  </label>
                  <input
                    type="text"
                    className="credora-input w-full rounded-xl"
                    placeholder="e.g., IIT Delhi"
                    value={formData.collegeName}
                    onChange={(e) =>
                      setFormData({ ...formData, collegeName: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Degree</label>
                  <input
                    type="text"
                    className="credora-input w-full rounded-xl"
                    placeholder="e.g., B.Tech"
                    value={formData.degree}
                    onChange={(e) =>
                      setFormData({ ...formData, degree: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Branch/Specialization
                  </label>
                  <input
                    type="text"
                    className="credora-input w-full rounded-xl"
                    placeholder="e.g., Computer Science"
                    value={formData.branch}
                    onChange={(e) =>
                      setFormData({ ...formData, branch: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Expected Graduation
                  </label>
                  <input
                    type="text"
                    className="credora-input w-full rounded-xl"
                    placeholder="e.g., 2025"
                    value={formData.graduationYear}
                    onChange={(e) =>
                      setFormData({ ...formData, graduationYear: e.target.value })
                    }
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-2">
                    Current CGPA
                  </label>
                  <input
                    type="text"
                    className="credora-input w-full rounded-xl"
                    placeholder="e.g., 9.2"
                    value={formData.cgpa}
                    onChange={(e) =>
                      setFormData({ ...formData, cgpa: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-2">GitHub Profile</h2>
                <p className="text-muted-foreground text-sm">
                  Connect your GitHub to showcase your projects and contributions
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  GitHub Username
                </label>
                <div className="flex gap-2">
                  <div className="flex items-center px-4 bg-secondary rounded-l-xl border-r border-border">
                    <Github className="w-5 h-5 text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">github.com/</span>
                  </div>
                  <input
                    type="text"
                    className="credora-input flex-1 rounded-l-none rounded-r-xl"
                    placeholder="username"
                    value={formData.githubUsername}
                    onChange={(e) =>
                      setFormData({ ...formData, githubUsername: e.target.value })
                    }
                  />
                </div>
              </div>
              {formData.githubUsername && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-credora-emerald/5 border border-credora-emerald/20"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-credora-emerald" />
                    <div>
                      <p className="font-medium text-sm">Profile detected</p>
                      <p className="text-xs text-muted-foreground">
                        156 commits • 12 repositories • 3 years active
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-2">Work Experience</h2>
                <p className="text-muted-foreground text-sm">
                  Add your internships and work experience
                </p>
              </div>
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-border bg-secondary/30">
                  <div className="grid sm:grid-cols-3 gap-4">
                    <input
                      type="text"
                      className="credora-input rounded-xl"
                      placeholder="Company name"
                    />
                    <input
                      type="text"
                      className="credora-input rounded-xl"
                      placeholder="Role"
                    />
                    <input
                      type="text"
                      className="credora-input rounded-xl"
                      placeholder="Duration"
                    />
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  + Add Another Experience
                </Button>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-2">Resume & Documents</h2>
                <p className="text-muted-foreground text-sm">
                  Upload your resume to complete your profile
                </p>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {!formData.resume ? (
                <div 
                  className="border-2 border-dashed border-border rounded-2xl p-8 text-center hover:border-credora-emerald/50 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                >
                  <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="font-medium mb-1">Drop your resume here</p>
                  <p className="text-sm text-muted-foreground">
                    or click to browse • PDF, DOC up to 5MB
                  </p>
                </div>
              ) : (
                <div className="border-2 border-credora-emerald rounded-2xl p-6 bg-credora-emerald/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-credora-emerald/10 flex items-center justify-center">
                        <FileText className="w-6 h-6 text-credora-emerald" />
                      </div>
                      <div>
                        <p className="font-medium">{formData.resume.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(formData.resume.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={removeFile}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-border">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            {currentStep === steps.length ? (
              <Button variant="hero">Complete Profile</Button>
            ) : (
              <Button variant="default" onClick={handleNext}>
                Continue
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    </StudentLayout>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
