import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { StudentLayout } from "@/components/layouts/StudentLayout";
import { 
  User, 
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
  Award,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getProfile, updateProfile, StudentProfile, UpdateProfileData } from "@/services/studentProfile.service";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export default function StudentSettings() {
  const [editSection, setEditSection] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [tempData, setTempData] = useState({
    name: "",
    email: "",
    phone: "",
    university: "",
    degree: "",
    branch: "",
    graduationYear: "",
    gpa: "",
    semester: "",
    githubUsername: "",
    repositoriesCount: "",
    contributionsCount: "",
    internships: 0,
    skills: [] as string[],
    certifications: [] as string[],
  });

  const [currentSkill, setCurrentSkill] = useState("");
  const [currentCertification, setCurrentCertification] = useState("");

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const data = await getProfile();
      if (data) {
        setProfile(data);
        setTempData({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          university: data.university || "",
          degree: data.degree || "",
          branch: data.branch || "",
          graduationYear: data.graduationYear?.toString() || "",
          gpa: data.gpa?.toString() || "",
          semester: data.semester || "",
          githubUsername: data.githubUsername || "",
          repositoriesCount: data.repositoriesCount?.toString() || "",
          contributionsCount: data.contributionsCount?.toString() || "",
          internships: data.internships || 0,
          skills: data.skills || [],
          certifications: data.certifications || [],
        });
      }
    } catch (err) {
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

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEdit = (section: string) => {
    setEditSection(section);
    if (profile) {
      setTempData({
        name: profile.name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        university: profile.university || "",
        degree: profile.degree || "",
        branch: profile.branch || "",
        graduationYear: profile.graduationYear?.toString() || "",
        gpa: profile.gpa?.toString() || "",
        semester: profile.semester || "",
        githubUsername: profile.githubUsername || "",
        repositoriesCount: profile.repositoriesCount?.toString() || "",
        contributionsCount: profile.contributionsCount?.toString() || "",
        internships: profile.internships || 0,
        skills: profile.skills || [],
        certifications: profile.certifications || [],
      });
    }
  };

  const handleSave = async (section: string) => {
    try {
      setIsSaving(true);
      
      let updatePayload: UpdateProfileData = {};

      switch (section) {
        case 'basic':
          updatePayload = {
            name: tempData.name,
            email: tempData.email,
            phone: tempData.phone,
          };
          break;
        case 'academic':
          updatePayload = {
            university: tempData.university,
            degree: tempData.degree,
            branch: tempData.branch,
            graduationYear: parseInt(tempData.graduationYear) || undefined,
            gpa: parseFloat(tempData.gpa) || undefined,
            semester: tempData.semester,
          };
          break;
        case 'github':
          updatePayload = {
            githubUsername: tempData.githubUsername,
            repositoriesCount: parseInt(tempData.repositoriesCount) || undefined,
            contributionsCount: parseInt(tempData.contributionsCount) || undefined,
          };
          break;
        case 'work':
          updatePayload = {
            internships: tempData.internships,
          };
          break;
        case 'skills':
          updatePayload = {
            skills: tempData.skills,
          };
          break;
        case 'certifications':
          updatePayload = {
            certifications: tempData.certifications,
          };
          break;
      }

      await updateProfile(updatePayload);
      
      // Refresh profile to get updated data
      await fetchProfile();
      setEditSection(null);
      
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (err) {
      const error = err as Error;
      console.error("Failed to update profile:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setTempData({
        name: profile.name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        university: profile.university || "",
        degree: profile.degree || "",
        branch: profile.branch || "",
        graduationYear: profile.graduationYear?.toString() || "",
        gpa: profile.gpa?.toString() || "",
        semester: profile.semester || "",
        githubUsername: profile.githubUsername || "",
        repositoriesCount: profile.repositoriesCount?.toString() || "",
        contributionsCount: profile.contributionsCount?.toString() || "",
        internships: profile.internships || 0,
        skills: profile.skills || [],
        certifications: profile.certifications || [],
      });
    }
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
    setTempData({ ...tempData, internships: tempData.internships + 1 });
  };

  const decrementInternships = () => {
    if (tempData.internships > 0) {
      setTempData({ ...tempData, internships: tempData.internships - 1 });
    }
  };

  // Get connected wallet address from localStorage
  const getWalletAddress = () => {
    try {
      const address = localStorage.getItem('walletAddress');
      if (address) {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
      }
      return 'Not connected';
    } catch {
      return 'Not connected';
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

  if (!profile) {
    return (
      <StudentLayout>
        <div className="max-w-2xl mx-auto mt-12">
          <div className="bg-card rounded-2xl border border-border p-8 text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">No Profile Found</h2>
            <p className="text-muted-foreground mb-6">
              Complete onboarding to set up your profile and start borrowing
            </p>
            <Button onClick={() => navigate('/student/onboarding')}>
              Complete Onboarding
            </Button>
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
          className="flex items-center justify-between"
        >
          <div>
            <h2 className="text-2xl font-bold">Profile & Settings</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Manage your profile information and preferences
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchProfile}
            disabled={isLoading}
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
            Refresh
          </Button>
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
                <Button variant="outline" size="sm" onClick={handleCancel} disabled={isSaving}>
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
                <Button variant="default" size="sm" onClick={() => handleSave('basic')} disabled={isSaving}>
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
                  placeholder="Enter your name"
                  value={tempData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  className="credora-input w-full rounded-xl"
                  placeholder="Enter your email"
                  value={tempData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <p className="font-medium">Display Name</p>
                  <p className="text-sm text-muted-foreground">{profile.name || 'Not set'}</p>
                </div>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{profile.email || 'Not set'}</p>
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
                <Button variant="outline" size="sm" onClick={handleCancel} disabled={isSaving}>
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
                <Button variant="default" size="sm" onClick={() => handleSave('academic')} disabled={isSaving}>
                  <Save className="w-4 h-4 mr-1" />
                  {isSaving ? "Saving..." : "Save"}
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
                  placeholder="Enter university name"
                  value={tempData.university}
                  onChange={(e) => handleInputChange('university', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Degree</label>
                <input
                  type="text"
                  className="credora-input w-full rounded-xl"
                  placeholder="e.g., B.Tech, M.Tech"
                  value={tempData.degree}
                  onChange={(e) => handleInputChange('degree', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Branch/Specialization</label>
                <input
                  type="text"
                  className="credora-input w-full rounded-xl"
                  placeholder="e.g., Computer Science"
                  value={tempData.branch}
                  onChange={(e) => handleInputChange('branch', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Expected Graduation Year</label>
                <input
                  type="text"
                  className="credora-input w-full rounded-xl"
                  placeholder="e.g., 2025"
                  value={tempData.graduationYear}
                  onChange={(e) => handleInputChange('graduationYear', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Current CGPA (0-10)</label>
                <input
                  type="text"
                  className="credora-input w-full rounded-xl"
                  placeholder="e.g., 8.5"
                  value={tempData.gpa}
                  onChange={(e) => handleInputChange('gpa', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Current Semester</label>
                <input
                  type="text"
                  className="credora-input w-full rounded-xl"
                  placeholder="e.g., 6th"
                  value={tempData.semester}
                  onChange={(e) => handleInputChange('semester', e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-4">
              <div className="py-3 border-b border-border">
                <p className="text-sm text-muted-foreground mb-1">College/University</p>
                <p className="font-medium">{profile.university || 'Not set'}</p>
              </div>
              <div className="py-3 border-b border-border">
                <p className="text-sm text-muted-foreground mb-1">Degree</p>
                <p className="font-medium">{profile.degree || 'Not set'}</p>
              </div>
              <div className="py-3 border-b border-border">
                <p className="text-sm text-muted-foreground mb-1">Branch</p>
                <p className="font-medium">{profile.branch || 'Not set'}</p>
              </div>
              <div className="py-3 border-b border-border">
                <p className="text-sm text-muted-foreground mb-1">Expected Graduation</p>
                <p className="font-medium">{profile.graduationYear || 'Not set'}</p>
              </div>
              <div className="py-3">
                <p className="text-sm text-muted-foreground mb-1">Current CGPA</p>
                <p className="font-medium">{profile.gpa?.toFixed(2) || 'Not set'}</p>
              </div>
              <div className="py-3">
                <p className="text-sm text-muted-foreground mb-1">Current Semester</p>
                <p className="font-medium">{profile.semester || 'Not set'}</p>
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
                <Button variant="outline" size="sm" onClick={handleCancel} disabled={isSaving}>
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
                <Button variant="default" size="sm" onClick={() => handleSave('github')} disabled={isSaving}>
                  <Save className="w-4 h-4 mr-1" />
                  {isSaving ? "Saving..." : "Save"}
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
                    placeholder="username"
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
                    placeholder="e.g., 25"
                    value={tempData.repositoriesCount}
                    onChange={(e) => handleInputChange('repositoriesCount', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Total Contributions</label>
                  <input
                    type="number"
                    className="credora-input w-full rounded-xl"
                    placeholder="e.g., 500"
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
                <a
                  href={`https://github.com/${profile.githubUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium font-mono text-blue-600 hover:underline"
                >
                  github.com/{profile.githubUsername}
                </a>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="py-3">
                  <p className="text-sm text-muted-foreground mb-1">Public Repositories</p>
                  <p className="font-medium text-lg">{profile.repositoriesCount || 0}</p>
                </div>
                <div className="py-3">
                  <p className="text-sm text-muted-foreground mb-1">Total Contributions</p>
                  <p className="font-medium text-lg">{profile.contributionsCount || 0}</p>
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
                <Button variant="outline" size="sm" onClick={handleCancel} disabled={isSaving}>
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
                <Button variant="default" size="sm" onClick={() => handleSave('work')} disabled={isSaving}>
                  <Save className="w-4 h-4 mr-1" />
                  {isSaving ? "Saving..." : "Save"}
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
                    disabled={tempData.internships === 0}
                    className="h-12 w-12 rounded-xl"
                  >
                    <Minus className="w-5 h-5" />
                  </Button>
                  <div className="flex-1 max-w-xs">
                    <input
                      type="number"
                      className="credora-input w-full rounded-xl text-center text-2xl font-bold py-3"
                      value={tempData.internships}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setTempData({ ...tempData, internships: Math.max(0, val) });
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
                  <span className="text-2xl font-bold text-credora-emerald">{profile.internships}</span>
                </div>
                <p className="font-medium">
                  {profile.internships === 1 ? 'Internship' : 'Internships'} Completed
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
                <Button variant="outline" size="sm" onClick={handleCancel} disabled={isSaving}>
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
                <Button variant="default" size="sm" onClick={() => handleSave('skills')} disabled={isSaving}>
                  <Save className="w-4 h-4 mr-1" />
                  {isSaving ? "Saving..." : "Save"}
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
                  placeholder="Add a skill (e.g., React, Python)"
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
              {(profile.skills && profile.skills.length > 0) ? (
                profile.skills.map((skill, index) => (
                  <div
                    key={index}
                    className="px-3 py-1.5 rounded-lg bg-credora-emerald/10 text-credora-emerald border border-credora-emerald/20"
                  >
                    <span className="text-sm font-medium">{skill}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No skills added yet</p>
              )}
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
                <Button variant="outline" size="sm" onClick={handleCancel} disabled={isSaving}>
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
                <Button variant="default" size="sm" onClick={() => handleSave('certifications')} disabled={isSaving}>
                  <Save className="w-4 h-4 mr-1" />
                  {isSaving ? "Saving..." : "Save"}
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
                  placeholder="Add a certification (e.g., AWS Cloud Practitioner)"
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
              {(profile.certifications && profile.certifications.length > 0) ? (
                profile.certifications.map((cert, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-lg bg-secondary/50 border border-border"
                  >
                    <span className="text-sm font-medium">{cert}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No certifications added yet</p>
              )}
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
                <p className="text-sm text-muted-foreground font-mono">{profile.walletAddress ? `${profile.walletAddress.slice(0, 6)}...${profile.walletAddress.slice(-4)}` : getWalletAddress()}</p>
              </div>
            </div>
            <span className="text-xs px-2 py-1 rounded-full bg-credora-emerald/10 text-credora-emerald">
              Connected
            </span>
          </div>
        </motion.div>

        {/* Danger Zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
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
