import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase, Project } from '@/lib/supabase';
import ProjectCard from '@/components/ProjectCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, Loader2, Filter, X } from 'lucide-react';

const CATEGORIES = [
  'All Categories',
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
  'All Status',
  'Open for Applications',
  'Team Formation',
  'In Progress',
  'Testing',
  'Completed',
];

const SKILL_FILTERS = [
  'React', 'Node.js', 'Python', 'Java', 'TypeScript', 'JavaScript',
  'UI/UX', 'MongoDB', 'PostgreSQL', 'AWS', 'Docker', 'Git',
];

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All Categories');
  const [status, setStatus] = useState('All Status');
  const [skillFilter, setSkillFilter] = useState<string[]>([]);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        owner:profiles!projects_owner_id_fkey(*),
        members:project_members(count)
      `)
      .order('created_at', { ascending: false });

    if (!error && data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setProjects(data.map((p: any) => ({
        ...p,
        member_count: p.members?.[0]?.count || 1
      })) as Project[]);
    }

    setLoading(false);
  };

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesSearch = search === '' ||
        project.title.toLowerCase().includes(search.toLowerCase()) ||
        project.description.toLowerCase().includes(search.toLowerCase());

      const matchesCategory = category === 'All Categories' || project.category === category;

      const matchesStatus = status === 'All Status' || project.status === status;

      const matchesSkills = skillFilter.length === 0 ||
        skillFilter.some(skill => project.required_skills?.includes(skill));

      return matchesSearch && matchesCategory && matchesStatus && matchesSkills;
    });
  }, [projects, search, category, status, skillFilter]);

  const toggleSkill = (skill: string) => {
    setSkillFilter(prev =>
      prev.includes(skill)
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground mt-1">
            Discover and join exciting projects
          </p>
        </div>
        <Button asChild>
          <Link to="/projects/new">
            <Plus className="h-4 w-4 mr-2" />
            Create Project
          </Link>
        </Button>
      </div>

      {/* Search & Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Status" />
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

        {/* Skill Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-muted-foreground" />
          {SKILL_FILTERS.map((skill) => (
            <Badge
              key={skill}
              variant={skillFilter.includes(skill) ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => toggleSkill(skill)}
            >
              {skill}
            </Badge>
          ))}
          {skillFilter.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSkillFilter([])}
            >
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredProjects.length} of {projects.length} projects
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">No projects found</h3>
          <p className="text-muted-foreground mt-1">
            Try adjusting your search or filters
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
