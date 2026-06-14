import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import { toast } from 'sonner';

const SKILL_SUGGESTIONS = [
  'React', 'Node.js', 'Python', 'Java', 'TypeScript', 'JavaScript',
  'UI/UX', 'Figma', 'CSS', 'HTML', 'MongoDB', 'PostgreSQL',
  'AWS', 'Docker', 'Git', 'GraphQL', 'REST APIs', 'Flutter',
  'Swift', 'Kotlin', 'C++', 'Rust', 'Go', 'R',
];

const FIELD_SUGGESTIONS = [
  'AI/ML', 'Web Development', 'Mobile Apps', 'Data Science',
  'Cybersecurity', 'Cloud Computing', 'DevOps', 'Game Development',
  'Blockchain', 'IoT', 'AR/VR', 'Natural Language Processing',
];

export default function Profile() {
  const { profile, updateProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [skills, setSkills] = useState<string[]>(profile?.skills || []);
  const [interestedFields, setInterestedFields] = useState<string[]>(profile?.interested_fields || []);
  const [newSkill, setNewSkill] = useState('');
  const [newField, setNewField] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setFullName(profile?.full_name || '');
    setBio(profile?.bio || '');
    setSkills(profile?.skills || []);
    setInterestedFields(profile?.interested_fields || []);
  }, [profile]);

  const handleSave = async () => {
    setIsLoading(true);
    const { error } = await updateProfile({
      full_name: fullName,
      bio,
      skills,
      interested_fields: interestedFields,
    });
    if (error) {
      console.error('Profile update error:', error);
      toast.error(error.message || 'Failed to update profile');
    } else {
      toast.success('Profile updated successfully');
    }
    setIsLoading(false);
  };

  const addSkill = (skill: string) => {
    if (skill && !skills.includes(skill)) {
      setSkills([...skills, skill]);
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill));
  };

  const addField = (field: string) => {
    if (field && !interestedFields.includes(field)) {
      setInterestedFields([...interestedFields, field]);
      setNewField('');
    }
  };

  const removeField = (field: string) => {
    setInterestedFields(interestedFields.filter(f => f !== field));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Profile</h1>
        <p className="text-muted-foreground mt-1">
          Manage your profile information and preferences
        </p>
      </div>

      <div className="grid gap-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Your public profile information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={profile?.email || ''}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Skills */}
        <Card>
          <CardHeader>
            <CardTitle>Skills</CardTitle>
            <CardDescription>Your technical skills and expertise</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <Badge key={skill} variant="secondary" className="gap-1 py-1 px-3">
                  {skill}
                  <button
                    onClick={() => removeSkill(skill)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="Add a skill"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill(newSkill))}
              />
              <Button variant="outline" size="icon" onClick={() => addSkill(newSkill)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
              <span className="text-sm text-muted-foreground mr-2">Suggestions:</span>
              {SKILL_SUGGESTIONS.filter(s => !skills.includes(s)).slice(0, 8).map((skill) => (
                <Badge
                  key={skill}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => addSkill(skill)}
                >
                  + {skill}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Interested Fields */}
        <Card>
          <CardHeader>
            <CardTitle>Interested Fields</CardTitle>
            <CardDescription>Areas you're interested in working on</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {interestedFields.map((field) => (
                <Badge key={field} variant="secondary" className="gap-1 py-1 px-3">
                  {field}
                  <button
                    onClick={() => removeField(field)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newField}
                onChange={(e) => setNewField(e.target.value)}
                placeholder="Add an interested field"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addField(newField))}
              />
              <Button variant="outline" size="icon" onClick={() => addField(newField)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
              <span className="text-sm text-muted-foreground mr-2">Suggestions:</span>
              {FIELD_SUGGESTIONS.filter(f => !interestedFields.includes(f)).map((field) => (
                <Badge
                  key={field}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => addField(field)}
                >
                  + {field}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}
