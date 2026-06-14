import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Project } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { X, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = [
  'AI/ML',
  'Web Development',
  'Mobile Apps',
  'Data Science',
  'Cybersecurity',
  'Game Development',
  'IoT',
  'Blockchain',
  'Other',
];

const STATUS_OPTIONS = [
  'Open for Applications',
  'Team Formation',
  'In Progress',
  'Testing',
  'Completed',
];

const SKILL_OPTIONS = [
  'React', 'Node.js', 'Python', 'Java', 'TypeScript', 'JavaScript',
  'UI/UX', 'Figma', 'CSS', 'HTML', 'MongoDB', 'PostgreSQL',
  'AWS', 'Docker', 'Git', 'GraphQL', 'REST APIs', 'Flutter',
  'Swift', 'Kotlin', 'C++', 'Machine Learning', 'TensorFlow',
];

export default function EditProject() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [teamSize, setTeamSize] = useState(4);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Open for Applications');
  const [newSkill, setNewSkill] = useState('');

  useEffect(() => {
    loadProject();
  }, [id]);

  const loadProject = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      toast.error('Project not found');
      navigate('/projects');
      return;
    }

    const project = data as Project;

    if (project.owner_id !== user?.id) {
      toast.error('You can only edit your own projects');
      navigate('/projects');
      return;
    }

    setTitle(project.title);
    setDescription(project.description);
    setCategory(project.category);
    setRequiredSkills(project.required_skills || []);
    setTeamSize(project.team_size);
    setProgress(project.progress);
    setStatus(project.status);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!title || !description || !category) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from('projects')
      .update({
        title,
        description,
        category,
        required_skills: requiredSkills,
        team_size: teamSize,
        progress,
        status,
      })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update project');
    } else {
      toast.success('Project updated successfully');
      navigate(`/projects/${id}`);
    }

    setSaving(false);
  };

  const addSkill = (skill: string) => {
    if (skill && !requiredSkills.includes(skill)) {
      setRequiredSkills([...requiredSkills, skill]);
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setRequiredSkills(requiredSkills.filter(s => s !== skill));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Project</h1>
        <p className="text-muted-foreground mt-1">
          Update your project details and progress
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
          <CardDescription>Update information about your project</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Project Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a descriptive project title"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your project goals, requirements, and what you're looking for in team members"
              rows={5}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Category *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Required Skills */}
          <div className="space-y-2">
            <Label>Required Skills</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {requiredSkills.map((skill) => (
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
                placeholder="Add a required skill"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill(newSkill))}
              />
              <Button variant="outline" size="icon" onClick={() => addSkill(newSkill)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              <span className="text-sm text-muted-foreground mr-2">Suggestions:</span>
              {SKILL_OPTIONS.filter(s => !requiredSkills.includes(s)).slice(0, 10).map((skill) => (
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
          </div>

          {/* Team Size */}
          <div className="space-y-2">
            <Label>Team Size: {teamSize} members</Label>
            <Slider
              value={[teamSize]}
              onValueChange={(value) => setTeamSize(value[0])}
              min={2}
              max={10}
              step={1}
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <Label>Progress: {progress}%</Label>
            <Slider
              value={[progress]}
              onValueChange={(value) => setProgress(value[0])}
              min={0}
              max={100}
              step={5}
            />
            <p className="text-sm text-muted-foreground">
              0% = Project Created, 20% = Planning, 40% = Development Started,
              60% = Core Features Complete, 80% = Testing, 100% = Completed
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => navigate(`/projects/${id}`)}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
