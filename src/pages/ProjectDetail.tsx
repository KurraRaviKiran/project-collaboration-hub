import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Project, Profile, JoinRequest, ProjectMember } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  Edit,
  Users,
  Calendar,
  UserPlus,
  Loader2,
  Check,
  X,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';

const statusColors: Record<string, string> = {
  'Open for Applications': 'bg-green-500/10 text-green-500 border-green-500/20',
  'Team Formation': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  'In Progress': 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  'Testing': 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  'Completed': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
};

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [owner, setOwner] = useState<Profile | null>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [userRequest, setUserRequest] = useState<JoinRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');

  const isOwner = project?.owner_id === user?.id;
  const isMember = members.some(m => m.user_id === user?.id);

  useEffect(() => {
    if (id) {
      loadProject();
    }
  }, [id, user]);

  const loadProject = async () => {
    setLoading(true);

    // Load project
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (projectError || !projectData) {
      toast.error('Project not found');
      navigate('/projects');
      return;
    }

    setProject(projectData as Project);

    // Load owner profile
    const { data: ownerData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', projectData.owner_id)
      .single();

    if (ownerData) {
      setOwner(ownerData as Profile);
    }

    // Load project members with user profiles
    const { data: membersData } = await supabase
      .from('project_members')
      .select('*, user:profiles(*)')
      .eq('project_id', id);

    if (membersData) {
      setMembers(membersData as ProjectMember[]);
    }

    // Load join requests (for owner)
    if (user?.id === projectData.owner_id) {
      const { data: requestsData } = await supabase
        .from('join_requests')
        .select('*, user:profiles(*)')
        .eq('project_id', id)
        .order('created_at', { ascending: false });

      if (requestsData) {
        setJoinRequests(requestsData as JoinRequest[]);
      }
    }

    // Check user's join request
    if (user && user.id !== projectData.owner_id) {
      const { data: requestData } = await supabase
        .from('join_requests')
        .select('*')
        .eq('project_id', id)
        .eq('user_id', user.id)
        .single();

      if (requestData) {
        setUserRequest(requestData as JoinRequest);
      }
    }

    setLoading(false);
  };

  const handleJoinRequest = async () => {
    if (!user) {
      toast.error('Please sign in to request to join this project.');
      navigate('/auth');
      return;
    }

    if (!project) return;

    setActionLoading(true);

    // Check if team is full
    if (members.length >= project.team_size) {
      toast.error('Team is already full');
      setActionLoading(false);
      return;
    }

    const { error } = await supabase.from('join_requests').insert({
      project_id: project.id,
      user_id: user.id,
      status: 'Pending',
    });

    if (error) {
      console.error('Join request error:', error);
      toast.error(error.message || 'Failed to send join request');
    } else {
      toast.success('Join request sent!');
      await loadProject();
    }

    setActionLoading(false);
  };

  const handleAcceptRequest = async (requestId: string, userId: string) => {
    if (!project) return;

    setActionLoading(true);

    // Update request status
    const { error: updateError } = await supabase
      .from('join_requests')
      .update({ status: 'Accepted' })
      .eq('id', requestId);

    if (updateError) {
      console.error('Accept request update error:', updateError);
      toast.error(updateError.message || 'Failed to accept request');
      setActionLoading(false);
      return;
    }

    // Add to project members
    const { error: memberError } = await supabase
      .from('project_members')
      .insert({
        project_id: project.id,
        user_id: userId,
        role: 'Team Member',
      });

    if (memberError) {
      console.error('Accept request member insert error:', memberError);
      toast.error(memberError.message || 'Failed to add member');
      setActionLoading(false);
      return;
    }

    toast.success('Member added to team');
    loadProject();
    setActionLoading(false);
  };

  const handleRejectRequest = async (requestId: string) => {
    setActionLoading(true);

    const { error } = await supabase
      .from('join_requests')
      .update({ status: 'Rejected' })
      .eq('id', requestId);

    if (error) {
      console.error('Reject request error:', error);
      toast.error(error.message || 'Failed to reject request');
    } else {
      toast.success('Request rejected');
      await loadProject();
    }

    setActionLoading(false);
  };

  const handleCancelRequest = async () => {
    if (!userRequest) return;

    setActionLoading(true);

    const { error } = await supabase
      .from('join_requests')
      .delete()
      .eq('id', userRequest.id);

    if (error) {
      toast.error('Failed to cancel request');
    } else {
      setUserRequest(null);
      toast.success('Request cancelled');
    }

    setActionLoading(false);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!project) {
    return null;
  }

  const pendingRequests = joinRequests.filter(r => r.status === 'Pending');

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={() => navigate('/projects')}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Projects
      </Button>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{project.title}</h1>
            <Badge variant="outline" className={statusColors[project.status] || ''}>
              {project.status}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Created {new Date(project.created_at).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {members.length} / {project.team_size} members
            </span>
          </div>
        </div>
        {isOwner && (
          <Button asChild>
            <Link to={`/projects/${project.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Project
            </Link>
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column - Main info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{project.description}</p>
            </CardContent>
          </Card>

          {/* Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Completion</span>
                <span className="font-medium">{project.progress}%</span>
              </div>
              <Progress value={project.progress} className="h-3" />
              <p className="text-xs text-muted-foreground">
                0% = Project Created | 20% = Planning | 40% = Development Started |
                60% = Core Features Complete | 80% = Testing | 100% = Completed
              </p>
            </CardContent>
          </Card>

          {/* Required Skills */}
          <Card>
            <CardHeader>
              <CardTitle>Required Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {project.required_skills?.length > 0 ? (
                  project.required_skills.map((skill) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground">No specific skills required</span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Team Members */}
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                {members.length} member{members.length !== 1 ? 's' : ''} in the team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {member.user?.full_name ? getInitials(member.user.full_name) : 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.user?.full_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {member.user?.skills?.slice(0, 3).join(', ')}
                          {member.user?.skills && member.user.skills.length > 3 && '...'}
                        </p>
                      </div>
                    </div>
                    <Badge variant={member.role === 'Project Owner' ? 'default' : 'outline'}>
                      {member.role}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column - Sidebar */}
        <div className="space-y-6">
          {/* Project owner */}
          <Card>
            <CardHeader>
              <CardTitle>Project Owner</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {owner?.full_name ? getInitials(owner.full_name) : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{owner?.full_name}</p>
                  <p className="text-sm text-muted-foreground">{owner?.email}</p>
                </div>
              </div>
              {owner?.bio && (
                <p className="text-sm text-muted-foreground mt-3">{owner.bio}</p>
              )}
            </CardContent>
          </Card>

          {/* Category */}
          <Card>
            <CardHeader>
              <CardTitle>Category</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary">{project.category}</Badge>
            </CardContent>
          </Card>

          {/* Join actions for non-members */}
          {!isOwner && !isMember && (
            <Card>
              <CardHeader>
                <CardTitle>Join This Project</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {members.length >= project.team_size ? (
                  <p className="text-sm text-muted-foreground">
                    This team is currently full.
                  </p>
                ) : userRequest ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-yellow-500" />
                      <span>Request {userRequest.status.toLowerCase()}</span>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleCancelRequest}
                      disabled={actionLoading}
                    >
                      Cancel Request
                    </Button>
                  </div>
                ) : (
                  <>
                    {user ? (
                      <>
                        <Textarea
                          placeholder="Add a message with your request (optional)"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          rows={3}
                        />
                        <Button
                          className="w-full"
                          onClick={handleJoinRequest}
                          disabled={actionLoading}
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Request to Join
                        </Button>
                      </>
                    ) : (
                      <Button className="w-full" onClick={() => navigate('/auth')}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Sign in to Request
                      </Button>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Member badge */}
          {isMember && !isOwner && (
            <Card className="border-green-500/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-green-500">
                  <Check className="h-5 w-5" />
                  <span className="font-medium">You are a team member</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Join requests for owner */}
          {isOwner && pendingRequests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Join Requests</CardTitle>
                <CardDescription>
                  {pendingRequests.length} pending request{pendingRequests.length !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="p-3 rounded-lg border space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {request.user?.full_name ? getInitials(request.user.full_name) : 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{request.user?.full_name}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {request.user?.skills?.slice(0, 3).map((skill) => (
                            <Badge key={skill} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleAcceptRequest(request.id, request.user_id)}
                        disabled={actionLoading || members.length >= project.team_size}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleRejectRequest(request.id)}
                        disabled={actionLoading}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
