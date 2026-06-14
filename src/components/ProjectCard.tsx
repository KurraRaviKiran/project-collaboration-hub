import { Link } from 'react-router-dom';
import { Project } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Users } from 'lucide-react';

interface ProjectCardProps {
  project: Project;
}

const statusColors: Record<string, string> = {
  'Open for Applications': 'bg-green-500/10 text-green-500 border-green-500/20',
  'Team Formation': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  'In Progress': 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  'Testing': 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  'Completed': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
};

export default function ProjectCard({ project }: ProjectCardProps) {
  const ownerInitials = project.owner?.full_name
    ? project.owner.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <Link to={`/projects/${project.id}`}>
      <Card className="h-full hover:shadow-lg transition-all duration-200 hover:border-primary/50 group cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg line-clamp-1 group-hover:text-primary transition-colors">
                {project.title}
              </CardTitle>
              <CardDescription className="line-clamp-2 mt-1">
                {project.description}
              </CardDescription>
            </div>
            <Badge variant="outline" className={statusColors[project.status] || ''}>
              {project.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Skills */}
          <div className="flex flex-wrap gap-1">
            {project.required_skills?.slice(0, 4).map((skill) => (
              <Badge key={skill} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
            {project.required_skills?.length > 4 && (
              <Badge variant="secondary" className="text-xs">
                +{project.required_skills.length - 4}
              </Badge>
            )}
          </div>

          {/* Progress */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{project.progress}%</span>
            </div>
            <Progress value={project.progress} className="h-2" />
          </div>

          {/* Team & Owner */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>
                {project.member_count || 1} / {project.team_size} members
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground hidden sm:block">
                {project.owner?.full_name}
              </span>
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                  {ownerInitials}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
