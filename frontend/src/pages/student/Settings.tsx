import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { StudentLayout } from "@/components/layouts/StudentLayout";
import { 
  User, 
  Bell, 
  Shield, 
  Wallet, 
  Trash2, 
  Edit, 
  Save, 
  X, 
  Plus,
  Minus,
  GraduationCap,
  Github,
  Briefcase,
  Award
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import studentService from "@/services/student.service";
import { useToast } from "@/hooks/use-toast";
import type { StudentProfile } from "@/types/api.types";

export default function StudentSettings() {
  const [isEditing, setIsEditing] = useState(false);
  const [editSection, setEditSection] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  
  const [profileData, setProfileData] = useState<any>({
    displayName: "",
    email: "",
    phone: "",
    collegeName: "",
    degree: "",
    branch: "",
    graduationYear: "",
    cgpa: "",
    semester: "",
    githubUsername: "",
    repositoriesCount: "",
    contributionsCount: "",
    numberOfInternships: 0,
    skills: [],
    certifications: [],
  });

  const [tempData, setTempData] = useState({ ...profileData });
  const [currentSkill, setCurrentSkill] = useState("");
  const [currentCertification, setCurrentCertification] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const data = await studentService.getProfile();
        const formattedData = {
          displayName: data.name || "",
          email: data.email || "",
          phone: "",
          collegeName: data.university || "",
          degree: "",
          branch: data.major || "",
          graduationYear: data.graduationYear?.toString() || "",
          cgpa: data.gpa?.toString() || "",
          semester: "",
          githubUsername: data.githubUsername || "",
          repositoriesCount: "",
          contributionsCount: "",
          numberOfInternships: 0,
          skills: [],
          certifications: [],
        };
        setProfileData(formattedData);
        setTempData(formattedData);
      } catch (err: any) {
        console.error("Failed to fetch profile:", err);
        toast({
          title: "Error",
          description: "Failed to load profile data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleEdit = (section: string) => {
    setEditSection(section);
    setTempData({ ...profileData });
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      const updatePayload: Partial<StudentProfile> = {
        name: tempData.displayName,
        email: tempData.email,
        university: tempData.collegeName,
        major: tempData.branch,
        gpa: parseFloat(tempData.cgpa) || undefined,
        graduationYear: parseInt(tempData.graduationYear) || undefined,
        githubUsername: tempData.githubUsername,
      };

      await studentService.updateProfile(updatePayload);
      setProfileData({ ...tempData });
      setEditSection(null);
      
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (err: any) {
      console.error("Failed to update profile:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setTempData({ ...profileData });
    setEditSection(null);
  };

  const handleInputChange = (field: string, value: string | number) => {
    setTempData({ ...tempData, [field]: value });
  };

  const handleAddSkill = () => {
    if (currentSkill.trim() && !tempData.skills.includes(currentSkill.trim())) {
      setTempData({ ...tempData, skills: [...tempData.skills, currentSkill.trim()] });
      setCurrentSkill("");
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setTempData({ ...tempData, skills: tempData.skills.filter(s => s !== skill) });
  };

  const handleAddCertification = () => {
    if (currentCertification.trim() && !tempData.certifications.includes(currentCertification.trim())) {
      setTempData({ ...tempData, certifications: [...tempData.certifications, currentCertification.trim()] });
      setCurrentCertification("");
    }
  };

  const handleRemoveCertification = (cert: string) => {
    setTempData({ ...tempData, certifications: tempData.certifications.filter(c => c !== cert) });
  };

  const incrementInternships = () => {
    setTempData({ ...tempData, numberOfInternships: tempData.numberOfInternships + 1 });
  };

  const decrementInternships = () => {
    if (tempData.numberOfInternships > 0) {
      setTempData({ ...tempData, numberOfInternships: tempData.numberOfInternships - 1 });
    }
  };
  
  if (isLoading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </StudentLayout>
    );
  }
  
  return (
    <StudentLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-2xl font-bold mb-6">Profile & Settings</h2>
        </motion.div>

        {/* Basic Profile Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl border border-border p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-muted-foreground" />
              <h3 className="font-semibold">Basic Information</h3>
            </div>
            {editSection === 'basic' ? (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCancel}>
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
                <Button variant="default" size="sm" onClick={handleSave} disabled={isSaving}>
                  <Save className="w-4 h-4 mr-1" />
                  {isSaving ? "Saving..." : "Save"}
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => handleEdit('basic')}>
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </Button>
            )}
          </div>
          
          {editSection === 'basic' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Display Name</label>
                <input
                  type="text"
                  className="credora-input w-full rounded-xl"
                  value={tempData.displayName}
                  onChange={(e) => handleInputChange('displayName', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  className="credora-input w-full rounded-xl"
                  value={tempData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Phone Number</label>
                <input
                  type="tel"
                  className="credora-input w-full rounded-xl"
                  value={tempData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <p className="font-medium">Display Name</p>
                  <p className="text-sm text-muted-foreground">{profileData.displayName}</p>
                </div>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{profileData.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">Phone Number</p>
                  <p className="text-sm text-muted-foreground">{profileData.phone}</p>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Academic Details Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-2xl border border-border p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <GraduationCap className="w-5 h-5 text-muted-foreground" />
              <h3 className="font-semibold">Academic Details</h3>
            </div>
            {editSection === 'academic' ? (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCancel}>
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
                <Button variant="default" size="sm" onClick={handleSave}>
                  <Save className="w-4 h-4 mr-1" />
                  Save
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => handleEdit('academic')}>
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </Button>
            )}
          </div>
          
          {editSection === 'academic' ? (
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">College/University</label>
                <input
                  type="text"
                  className="credora-input w-full rounded-xl"
                  value={tempData.collegeName}
                  onChange={(e) => handleInputChange('collegeName', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Degree</label>
                <input
                  type="text"
                  className="credora-input w-full rounded-xl"
                  value={tempData.degree}
                  onChange={(e) => handleInputChange('degree', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Branch/Specialization</label>
                <input
                  type="text"
                  className="credora-input w-full rounded-xl"
                  value={tempData.branch}
                  onChange={(e) => handleInputChange('branch', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Expected Graduation</label>
                <input
                  type="text"
                  className="credora-input w-full rounded-xl"
                  value={tempData.graduationYear}
                  onChange={(e) => handleInputChange('graduationYear', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Current CGPA</label>
                <input
                  type="text"
                  className="credora-input w-full rounded-xl"
                  value={tempData.cgpa}
                  onChange={(e) => handleInputChange('cgpa', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Current Semester</label>
                <input
                  type="text"
                  className="credora-input w-full rounded-xl"
                  value={tempData.semester}
                  onChange={(e) => handleInputChange('semester', e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-4">
              <div className="py-3 border-b border-border">
                <p className="text-sm text-muted-foreground mb-1">College/University</p>
                <p className="font-medium">{profileData.collegeName}</p>
              </div>
              <div className="py-3 border-b border-border">
                <p className="text-sm text-muted-foreground mb-1">Degree</p>
                <p className="font-medium">{profileData.degree}</p>
              </div>
              <div className="py-3 border-b border-border">
                <p className="text-sm text-muted-foreground mb-1">Branch</p>
                <p className="font-medium">{profileData.branch}</p>
              </div>
              <div className="py-3 border-b border-border">
                <p className="text-sm text-muted-foreground mb-1">Expected Graduation</p>
                <p className="font-medium">{profileData.graduationYear}</p>
              </div>
              <div className="py-3">
                <p className="text-sm text-muted-foreground mb-1">Current CGPA</p>
                <p className="font-medium">{profileData.cgpa}</p>
              </div>
              <div className="py-3">
                <p className="text-sm text-muted-foreground mb-1">Current Semester</p>
                <p className="font-medium">{profileData.semester}</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* GitHub Profile Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-2xl border border-border p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Github className="w-5 h-5 text-muted-foreground" />
              <h3 className="font-semibold">GitHub Profile</h3>
            </div>
            {editSection === 'github' ? (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCancel}>
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
                <Button variant="default" size="sm" onClick={handleSave}>
                  <Save className="w-4 h-4 mr-1" />
                  Save
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => handleEdit('github')}>
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </Button>
            )}
          </div>
          
          {editSection === 'github' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">GitHub Username</label>
                <div className="flex gap-2">
                  <div className="flex items-center px-4 bg-secondary rounded-l-xl border-r border-border">
                    <Github className="w-5 h-5 text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">github.com/</span>
                  </div>
                  <input
                    type="text"
                    className="credora-input flex-1 rounded-l-none rounded-r-xl"
                    value={tempData.githubUsername}
                    onChange={(e) => handleInputChange('githubUsername', e.target.value)}
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Public Repositories</label>
                  <input
                    type="number"
                    className="credora-input w-full rounded-xl"
                    value={tempData.repositoriesCount}
                    onChange={(e) => handleInputChange('repositoriesCount', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Total Contributions</label>
                  <input
                    type="number"
                    className="credora-input w-full rounded-xl"
                    value={tempData.contributionsCount}
                    onChange={(e) => handleInputChange('contributionsCount', e.target.value)}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="py-3 border-b border-border">
                <p className="text-sm text-muted-foreground mb-1">Username</p>
                <p className="font-medium font-mono">github.com/{profileData.githubUsername}</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="py-3">
                  <p className="text-sm text-muted-foreground mb-1">Public Repositories</p>
                  <p className="font-medium text-lg">{profileData.repositoriesCount}</p>
                </div>
                <div className="py-3">
                  <p className="text-sm text-muted-foreground mb-1">Total Contributions</p>
                  <p className="font-medium text-lg">{profileData.contributionsCount}</p>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Work Experience Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card rounded-2xl border border-border p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Briefcase className="w-5 h-5 text-muted-foreground" />
              <h3 className="font-semibold">Work Experience</h3>
            </div>
            {editSection === 'work' ? (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCancel}>
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
                <Button variant="default" size="sm" onClick={handleSave}>
                  <Save className="w-4 h-4 mr-1" />
                  Save
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => handleEdit('work')}>
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </Button>
            )}
          </div>
          
          {editSection === 'work' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-3">Number of Internships</label>
                <div className="flex items-center gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={decrementInternships}
                    disabled={tempData.numberOfInternships === 0}
                    className="h-12 w-12 rounded-xl"
                  >
                    <Minus className="w-5 h-5" />
                  </Button>
                  <div className="flex-1 max-w-xs">
                    <input
                      type="number"
                      className="credora-input w-full rounded-xl text-center text-2xl font-bold py-3"
                      value={tempData.numberOfInternships}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setTempData({ ...tempData, numberOfInternships: Math.max(0, val) });
                      }}
                      min="0"
                    />
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
              </div>
            </div>
          ) : (
            <div className="py-3">
              <p className="text-sm text-muted-foreground mb-2">Total Internships Completed</p>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-xl bg-credora-emerald/10 flex items-center justify-center">
                  <span className="text-2xl font-bold text-credora-emerald">{profileData.numberOfInternships}</span>
                </div>
                <p className="font-medium">
                  {profileData.numberOfInternships === 1 ? 'Internship' : 'Internships'} Completed
                </p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Skills Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-card rounded-2xl border border-border p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Award className="w-5 h-5 text-muted-foreground" />
              <h3 className="font-semibold">Skills</h3>
            </div>
            {editSection === 'skills' ? (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCancel}>
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
                <Button variant="default" size="sm" onClick={handleSave}>
                  <Save className="w-4 h-4 mr-1" />
                  Save
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => handleEdit('skills')}>
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </Button>
            )}
          </div>
          
          {editSection === 'skills' ? (
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  className="credora-input flex-1 rounded-xl"
                  placeholder="Add a skill"
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
              {tempData.skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tempData.skills.map((skill, index) => (
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
          ) : (
            <div className="flex flex-wrap gap-2">
              {profileData.skills.map((skill, index) => (
                <div
                  key={index}
                  className="px-3 py-1.5 rounded-lg bg-credora-emerald/10 text-credora-emerald border border-credora-emerald/20"
                >
                  <span className="text-sm font-medium">{skill}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Certifications Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-card rounded-2xl border border-border p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Award className="w-5 h-5 text-muted-foreground" />
              <h3 className="font-semibold">Certifications</h3>
            </div>
            {editSection === 'certifications' ? (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCancel}>
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
                <Button variant="default" size="sm" onClick={handleSave}>
                  <Save className="w-4 h-4 mr-1" />
                  Save
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => handleEdit('certifications')}>
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </Button>
            )}
          </div>
          
          {editSection === 'certifications' ? (
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  className="credora-input flex-1 rounded-xl"
                  placeholder="Add a certification"
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
              {tempData.certifications.length > 0 && (
                <div className="space-y-2">
                  {tempData.certifications.map((cert, index) => (
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
          ) : (
            <div className="space-y-2">
              {profileData.certifications.map((cert, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg bg-secondary/50 border border-border"
                >
                  <span className="text-sm font-medium">{cert}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Wallet Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-card rounded-2xl border border-border p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <Wallet className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-semibold">Connected Wallet</h3>
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-credora-emerald/10 flex items-center justify-center">
                <span className="text-credora-emerald font-bold">M</span>
              </div>
              <div>
                <p className="font-medium">MetaMask</p>
                <p className="text-sm text-muted-foreground font-mono">0x1234...5678</p>
              </div>
            </div>
            <span className="text-xs px-2 py-1 rounded-full bg-credora-emerald/10 text-credora-emerald">
              Connected
            </span>
          </div>
        </motion.div>

        {/* Notifications Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-card rounded-2xl border border-border p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <Bell className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-semibold">Notifications</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Payment Reminders</p>
                <p className="text-sm text-muted-foreground">Get notified before due dates</p>
              </div>
              <div className="w-12 h-6 rounded-full bg-credora-emerald flex items-center px-1">
                <div className="w-4 h-4 rounded-full bg-accent-foreground ml-auto" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Credit Updates</p>
                <p className="text-sm text-muted-foreground">Limit changes and opportunities</p>
              </div>
              <div className="w-12 h-6 rounded-full bg-credora-emerald flex items-center px-1">
                <div className="w-4 h-4 rounded-full bg-accent-foreground ml-auto" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Marketing Emails</p>
                <p className="text-sm text-muted-foreground">Tips and product updates</p>
              </div>
              <div className="w-12 h-6 rounded-full bg-secondary flex items-center px-1">
                <div className="w-4 h-4 rounded-full bg-muted-foreground" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Security Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-card rounded-2xl border border-border p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-semibold">Security</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="font-medium">Two-Factor Authentication</p>
                <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
              </div>
              <Button variant="outline" size="sm">Enable</Button>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium">Active Sessions</p>
                <p className="text-sm text-muted-foreground">Manage your logged in devices</p>
              </div>
              <Button variant="outline" size="sm">View</Button>
            </div>
          </div>
        </motion.div>

        {/* Danger Zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="bg-destructive/5 border border-destructive/20 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Trash2 className="w-5 h-5 text-destructive" />
            <h3 className="font-semibold text-destructive">Danger Zone</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <Button variant="destructive" size="sm">Delete Account</Button>
        </motion.div>
      </div>
    </StudentLayout>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
