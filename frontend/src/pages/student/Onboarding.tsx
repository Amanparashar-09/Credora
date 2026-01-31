import { useState, useRef, useEffect } from "react";
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
  Plus,
  Minus,
  User,
  Settings,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import studentService from "@/services/student.service";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import type { OnboardingData } from "@/types/api.types";
import { getProfile, StudentProfile } from "@/services/studentProfile.service";

const steps = [
  { id: 1, title: "Basic Info", icon: User },
  { id: 2, title: "Academic Details", icon: GraduationCap },
  { id: 3, title: "GitHub Profile", icon: Github },
  { id: 4, title: "Work Experience", icon: Briefcase },
  { id: 5, title: "Resume & Documents", icon: FileText },
];

export default function StudentOnboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [existingProfile, setExistingProfile] = useState<StudentProfile | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    // Basic Info
    name: "",
    email: "",
    phone: "",
    // Academic
    collegeName: "",
    degree: "",
    branch: "",
    graduationYear: "",
    cgpa: "",
    semester: "",
    // GitHub
    githubUsername: "",
    repositoriesCount: "",
    contributionsCount: "",
    // Work
    numberOfInternships: 0,
    // Documents
    resume: null as File | null,
    // Additional
    skills: [] as string[],
    certifications: [] as string[],
  });
  const [currentSkill, setCurrentSkill] = useState("");
  const [currentCertification, setCurrentCertification] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if user has already completed onboarding
  useEffect(() => {
    const checkExistingProfile = async () => {
      try {
        setIsLoading(true);
        const profile = await getProfile();
        if (profile && profile.creditScore > 0) {
          setExistingProfile(profile);
        }
      } catch (err) {
        console.error("Error checking profile:", err);
      } finally {
        setIsLoading(false);
      }
    };
    checkExistingProfile();
  }, []);

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
      // Validate file type - PDF only for AI processing
      if (file.type !== 'application/pdf') {
        toast({
          title: "Invalid File Type",
          description: "Please upload a PDF file only",
          variant: "destructive",
        });
        return;
      }
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "File size must be less than 5MB",
          variant: "destructive",
        });
        return;
      }
      setFormData({ ...formData, resume: file });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      // Validate and set file - PDF only for AI processing
      if (file.type !== 'application/pdf') {
        toast({
          title: "Invalid File Type",
          description: "Please upload a PDF file only",
          variant: "destructive",
        });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "File size must be less than 5MB",
          variant: "destructive",
        });
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

  const handleAddSkill = () => {
    if (currentSkill.trim() && !formData.skills.includes(currentSkill.trim())) {
      setFormData({ ...formData, skills: [...formData.skills, currentSkill.trim()] });
      setCurrentSkill("");
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setFormData({ ...formData, skills: formData.skills.filter(s => s !== skill) });
  };

  const handleAddCertification = () => {
    if (currentCertification.trim() && !formData.certifications.includes(currentCertification.trim())) {
      setFormData({ ...formData, certifications: [...formData.certifications, currentCertification.trim()] });
      setCurrentCertification("");
    }
  };

  const handleRemoveCertification = (cert: string) => {
    setFormData({ ...formData, certifications: formData.certifications.filter(c => c !== cert) });
  };

  const incrementInternships = () => {
    setFormData({ ...formData, numberOfInternships: formData.numberOfInternships + 1 });
  };

  const decrementInternships = () => {
    if (formData.numberOfInternships > 0) {
      setFormData({ ...formData, numberOfInternships: formData.numberOfInternships - 1 });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleCompleteOnboarding = async () => {
    try {
      setIsSubmitting(true);
      
      // Validate required fields
      if (!formData.name || !formData.email) {
        toast({
          title: "Missing Required Fields",
          description: "Please fill in your name and email address",
          variant: "destructive",
        });
        return;
      }

      if (!formData.githubUsername || !formData.cgpa || !formData.resume) {
        toast({
          title: "Missing Required Fields",
          description: "Please fill in GitHub username, GPA, and upload your resume",
          variant: "destructive",
        });
        return;
      }

      // Validate GPA range (0-10)
      const gpa = parseFloat(formData.cgpa);
      if (isNaN(gpa) || gpa < 0 || gpa > 10) {
        toast({
          title: "Invalid GPA",
          description: "GPA must be between 0 and 10",
          variant: "destructive",
        });
        return;
      }

      // Import student profile service
      const { submitProfile, updateProfile } = await import('@/services/studentProfile.service');

      // Prepare profile data for AI scoring
      const profileData = {
        githubUsername: formData.githubUsername,
        gpa: gpa,
        internships: formData.numberOfInternships,
        resume: formData.resume,
      };

      // Submit to AI engine for credit scoring
      const profile = await submitProfile(profileData);

      // Update profile with additional fields (basic info, academic, etc.)
      await updateProfile({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        university: formData.collegeName,
        degree: formData.degree,
        branch: formData.branch,
        graduationYear: parseInt(formData.graduationYear) || undefined,
        semester: formData.semester,
        repositoriesCount: parseInt(formData.repositoriesCount) || undefined,
        contributionsCount: parseInt(formData.contributionsCount) || undefined,
        skills: formData.skills,
        certifications: formData.certifications,
      });

      // Also submit standard onboarding data if fields are filled
      if (formData.collegeName && formData.branch) {
        const onboardingData: Partial<OnboardingData> = {
          name: formData.name,
          email: formData.email,
          university: formData.collegeName,
          major: formData.branch,
          gpa: gpa,
          graduationYear: parseInt(formData.graduationYear) || new Date().getFullYear(),
          githubUsername: formData.githubUsername,
        };
        await studentService.completeOnboarding(onboardingData as OnboardingData);
      }

      toast({
        title: "Success!",
        description: `Your credit score is ${profile.creditScore}. Your buying power is $${parseFloat(profile.availableCredit).toLocaleString()}`,
      });

      // Redirect to credit details page
      navigate("/student/credit");
    } catch (err) {
      const error = err as Error;
      console.error("Onboarding failed:", err);
      toast({
        title: "Error",
        description: error.message || "Failed to complete onboarding",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <StudentLayout>
      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Checking profile status...</p>
          </div>
        </div>
      )}

      {/* Profile Already Completed State */}
      {!isLoading && existingProfile && (
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-2xl border border-border p-8 text-center"
          >
            {/* Success Icon */}
            <div className="w-24 h-24 rounded-full bg-credora-emerald/10 flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-12 h-12 text-credora-emerald" />
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold mb-2">Profile Completed!</h2>
            <p className="text-muted-foreground mb-8">
              You have already completed your onboarding. Your credit profile is active.
            </p>

            {/* Credit Score Display */}
            <div className="bg-gradient-to-br from-credora-emerald/10 to-credora-navy/10 rounded-2xl p-6 mb-8">
              <div className="grid sm:grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Credit Score</p>
                  <p className="text-3xl font-bold text-credora-emerald">{existingProfile.creditScore}</p>
                  <p className="text-xs text-muted-foreground">out of 100</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Available Credit</p>
                  <p className="text-3xl font-bold">${parseFloat(existingProfile.availableCredit || '0').toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">USDC</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Risk Tier</p>
                  <p className={cn(
                    "text-2xl font-bold",
                    existingProfile.riskTier === 'LOW' && "text-credora-emerald",
                    existingProfile.riskTier === 'MEDIUM' && "text-yellow-500",
                    existingProfile.riskTier === 'HIGH' && "text-red-500"
                  )}>
                    {existingProfile.riskTier}
                  </p>
                  <p className="text-xs text-muted-foreground">tier</p>
                </div>
              </div>
            </div>

            {/* Profile Summary */}
            {existingProfile.name && (
              <div className="bg-secondary/50 rounded-xl p-4 mb-8 text-left">
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Name</p>
                    <p className="font-medium">{existingProfile.name}</p>
                  </div>
                  {existingProfile.email && (
                    <div>
                      <p className="text-muted-foreground">Email</p>
                      <p className="font-medium">{existingProfile.email}</p>
                    </div>
                  )}
                  {existingProfile.university && (
                    <div>
                      <p className="text-muted-foreground">University</p>
                      <p className="font-medium">{existingProfile.university}</p>
                    </div>
                  )}
                  {existingProfile.githubUsername && (
                    <div>
                      <p className="text-muted-foreground">GitHub</p>
                      <p className="font-medium">@{existingProfile.githubUsername}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="outline"
                onClick={() => navigate('/student/credit')}
                className="rounded-xl"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                View Credit Details
              </Button>
              <Button
                variant="hero"
                onClick={() => navigate('/student/settings')}
                className="rounded-xl"
              >
                <Settings className="w-4 h-4 mr-2" />
                Update Profile
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Normal Onboarding Flow */}
      {!isLoading && !existingProfile && (
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
                <h2 className="text-xl font-semibold mb-2">Basic Information</h2>
                <p className="text-muted-foreground text-sm">
                  Tell us about yourself
                </p>
              </div>
              <div className="grid sm:grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Full Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    className="credora-input w-full rounded-xl"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Email Address <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="email"
                    className="credora-input w-full rounded-xl"
                    placeholder="your.email@example.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
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
                    onChange={(e) => handleInputChange('collegeName', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Degree</label>
                  <input
                    type="text"
                    className="credora-input w-full rounded-xl"
                    placeholder="e.g., B.Tech"
                    value={formData.degree}
                    onChange={(e) => handleInputChange('degree', e.target.value)}
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
                    onChange={(e) => handleInputChange('branch', e.target.value)}
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
                    onChange={(e) => handleInputChange('graduationYear', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Current CGPA
                  </label>
                  <input
                    type="text"
                    className="credora-input w-full rounded-xl"
                    placeholder="e.g., 9.2"
                    value={formData.cgpa}
                    onChange={(e) => handleInputChange('cgpa', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Current Semester
                  </label>
                  <input
                    type="text"
                    className="credora-input w-full rounded-xl"
                    placeholder="e.g., 6"
                    value={formData.semester}
                    onChange={(e) => handleInputChange('semester', e.target.value)}
                  />
                </div>
              </div>

              {/* Skills Section */}
              <div className="space-y-3 pt-4">
                <label className="block text-sm font-medium">
                  Skills (Optional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="credora-input flex-1 rounded-xl"
                    placeholder="e.g., React, Node.js, Python"
                    value={currentSkill}
                    onChange={(e) => setCurrentSkill(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddSkill}
                    className="rounded-xl"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {formData.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.skills.map((skill, index) => (
                      <div
                        key={index}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-credora-emerald/10 text-credora-emerald border border-credora-emerald/20"
                      >
                        <span className="text-sm font-medium">{skill}</span>
                        <button
                          onClick={() => handleRemoveSkill(skill)}
                          className="hover:text-credora-emerald/70 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === 3 && (
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
                    onChange={(e) => handleInputChange('githubUsername', e.target.value)}
                  />
                </div>
              </div>
              
              {/* GitHub Stats */}
              <div className="grid sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Public Repositories
                  </label>
                  <input
                    type="number"
                    className="credora-input w-full rounded-xl"
                    placeholder="e.g., 25"
                    value={formData.repositoriesCount}
                    onChange={(e) => handleInputChange('repositoriesCount', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Total Contributions
                  </label>
                  <input
                    type="number"
                    className="credora-input w-full rounded-xl"
                    placeholder="e.g., 500"
                    value={formData.contributionsCount}
                    onChange={(e) => handleInputChange('contributionsCount', e.target.value)}
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
                        {formData.repositoriesCount || "0"} repositories • {formData.contributionsCount || "0"} contributions
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-2">Work Experience</h2>
                <p className="text-muted-foreground text-sm">
                  Tell us about your professional experience
                </p>
              </div>
              
              {/* Number of Internships Counter */}
              <div className="space-y-3">
                <label className="block text-sm font-medium">
                  Number of Internships
                </label>
                <div className="flex items-center gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={decrementInternships}
                    disabled={formData.numberOfInternships === 0}
                    className="h-12 w-12 rounded-xl"
                  >
                    <Minus className="w-5 h-5" />
                  </Button>
                  <div className="flex-1 max-w-xs">
                    <div className="relative">
                      <input
                        type="number"
                        className="credora-input w-full rounded-xl text-center text-2xl font-bold py-3"
                        value={formData.numberOfInternships}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setFormData({ ...formData, numberOfInternships: Math.max(0, val) });
                        }}
                        min="0"
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={incrementInternships}
                    className="h-12 w-12 rounded-xl"
                  >
                    <Plus className="w-5 h-5" />
                  </Button>
                </div>
                {formData.numberOfInternships > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-credora-emerald/5 border border-credora-emerald/20"
                  >
                    <div className="flex items-center gap-3">
                      <Briefcase className="w-5 h-5 text-credora-emerald" />
                      <div>
                        <p className="font-medium text-sm">
                          {formData.numberOfInternships} {formData.numberOfInternships === 1 ? 'Internship' : 'Internships'} recorded
                        </p>
                        <p className="text-xs text-muted-foreground">
                          This will boost your credit score
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Certifications Section */}
              <div className="space-y-3 pt-4">
                <label className="block text-sm font-medium">
                  Certifications (Optional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="credora-input flex-1 rounded-xl"
                    placeholder="e.g., AWS Certified Developer"
                    value={currentCertification}
                    onChange={(e) => setCurrentCertification(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCertification())}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddCertification}
                    className="rounded-xl"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {formData.certifications.length > 0 && (
                  <div className="space-y-2">
                    {formData.certifications.map((cert, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border"
                      >
                        <span className="text-sm font-medium">{cert}</span>
                        <button
                          onClick={() => handleRemoveCertification(cert)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === 5 && (
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
              <Button variant="hero" onClick={handleCompleteOnboarding} disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Complete Profile"}
              </Button>
            ) : (
              <Button variant="default" onClick={handleNext}>
                Continue
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </motion.div>
      </div>
      )}
    </StudentLayout>
  );
}
