import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Project, JoinRequest } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  FolderKanban,
  Users,
  UserPlus,
  Clock,
  Plus,
  ArrowRight,
  Loader2,
} from 'lucide-react';

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);

  const [ownedProjects, setOwnedProjects] = useState<Project[]>([]);
  const [joinedProjects, setJoinedProjects] = useState<Project[]>([]);
  const [pendingRequests, setPendingRequests] = useState<JoinRequest[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<JoinRequest[]>([]);

  useEffect(() => {
    loadDashboard();
  }, [user]);

  const loadDashboard = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // Load owned projects
      const { data: ownedData, error: ownedError } = await supabase
        .from('projects')
        .select('*, members:project_members(count)')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      console.debug('ownedData', { ownedData, ownedError });

      if (ownedData) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const projects = (ownedData as any[]).map(p => ({
          ...p,
          member_count: p.members?.[0]?.count || 1
        }));
        setOwnedProjects(projects as Project[]);
      }

      // Load joined projects (via project_members)
      const { data: memberData, error: memberError } = await supabase
        .from('project_members')
        .select('project:projects(*, members:project_members(count))')
        .eq('user_id', user.id)
        .neq('role', 'Project Owner');

      console.debug('memberData', { memberData, memberError });

      if (memberData) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const projects = (memberData as any[])
          .filter(m => m.project)
          .map(m => ({
            ...m.project,
            member_count: m.project.members?.[0]?.count || 1
          }));
        setJoinedProjects(projects as Project[]);
      }

      // Load user's pending join requests
      const { data: userRequests, error: userReqError } = await supabase
        .from('join_requests')
        .select('*, project:projects(*)')
        .eq('user_id', user.id)
        .eq('status', 'Pending')
        .order('created_at', { ascending: false });

      console.debug('userRequests', { userRequests, userReqError });

      if (userRequests) {
        setPendingRequests(userRequests as JoinRequest[]);
      }

      // Load incoming join requests for owned projects
      if (ownedData && ownedData.length > 0) {
        const projectIds = ownedData.map(p => p.id);
        const { data: incomingData, error: incomingError } = await supabase
          .from('join_requests')
          .select('*, project:projects(*), user:profiles(*)')
          .eq('status', 'Pending')
          .in('project_id', projectIds)
          .order('created_at', { ascending: false });

        console.debug('incomingRequests', { incomingData, incomingError });

        if (incomingData) {
          setIncomingRequests(incomingData as JoinRequest[]);
        }
      }
    } catch (err) {
      console.error('loadDashboard error', err);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  };

  const stats = [
    {
      title: 'Projects Created',
      value: ownedProjects.length,
      icon: FolderKanban,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      title: 'Projects Joined',
      value: joinedProjects.length,
      icon: Users,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
    },
    {
      title: 'Pending Requests',
      value: pendingRequests.length,
      icon: Clock,
      color: 'text-yellow-500',
      bg: 'bg-yellow-500/10',
    },
    {
      title: 'Incoming Requests',
      value: incomingRequests.length,
      icon: UserPlus,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {profile?.full_name?.split(' ')[0]}!</h1>
          <p className="text-muted-foreground mt-1">
            Here's an overview of your collaboration activity
          </p>
        </div>
        <Button asChild>
          <Link to="/projects/new">
            <Plus className="h-4 w-4 mr-2" />
            Create Project
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* My Projects */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">My Projects</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/projects">
                  View All <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
            <CardDescription>Projects you own</CardDescription>
          </CardHeader>
          <CardContent>
            {ownedProjects.length === 0 ? (
              <div className="text-center py-8">
                <FolderKanban className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No projects yet</p>
                <Button variant="link" size="sm" asChild className="mt-2">
                  <Link to="/projects/new">Create your first project</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {ownedProjects.slice(0, 3).map((project) => (
                  <Link
                    key={project.id}
                    to={`/projects/${project.id}`}
                    className="block p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-medium line-clamp-1">{project.title}</h4>
                      <Badge variant="outline" className="shrink-0">
                        {project.status}
                      </Badge>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span>{project.progress}%</span>
                      </div>
                      <Progress value={project.progress} className="h-2" />
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                      <Users className="h-3 w-3" />
                      {project.member_count} members
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Projects Joined */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Projects Joined</CardTitle>
            <CardDescription>Projects you're collaborating on</CardDescription>
          </CardHeader>
          <CardContent>
            {joinedProjects.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">Not a member of any projects</p>
                <Button variant="link" size="sm" asChild className="mt-2">
                  <Link to="/projects">Browse projects to join</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {joinedProjects.slice(0, 3).map((project) => (
                  <Link
                    key={project.id}
                    to={`/projects/${project.id}`}
                    className="block p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-medium line-clamp-1">{project.title}</h4>
                      <Badge variant="outline" className="shrink-0">
                        {project.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {project.description}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-3 w-3" />
                      {project.member_count} members
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Requests (for user) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">My Join Requests</CardTitle>
            <CardDescription>Status of your project join requests</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingRequests.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No pending requests</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div>
                      <p className="font-medium">{request.project?.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Requested {new Date(request.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-yellow-500 border-yellow-500/50">
                      Pending
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Incoming Requests (for project owner) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Incoming Requests</CardTitle>
            <CardDescription>People asking to join your projects</CardDescription>
          </CardHeader>
          <CardContent>
            {incomingRequests.length === 0 ? (
              <div className="text-center py-8">
                <UserPlus className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No pending join requests</p>
              </div>
            ) : (
              <div className="space-y-3">
                {incomingRequests.slice(0, 5).map((request) => (
                  <Link
                    key={request.id}
                    to={`/projects/${request.project_id}`}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {request.user?.full_name ? getInitials(request.user.full_name) : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{request.user?.full_name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        wants to join <span className="text-foreground">{request.project?.title}</span>
                      </p>
                    </div>
                    <Badge className="shrink-0">Review</Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" asChild>
              <Link to="/projects">
                <FolderKanban className="h-4 w-4 mr-2" />
                Browse Projects
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/projects/new">
                <Plus className="h-4 w-4 mr-2" />
                Create New Project
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/profile">
                Update Profile
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
