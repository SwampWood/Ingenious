from django.shortcuts import render, get_object_or_404
from django.contrib.auth import get_user_model
from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Q
from .models import Project, Task, ProjectMembership
from .serializers import ProjectSerializer, TaskSerializer, ProjectMembershipSerializer



User = get_user_model()

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def add_project_member(request, project_id):
    project = get_object_or_404(Project, id=project_id)
    
    if not (project.creator == request.user or project.participants.filter(id=request.user.id).exists()):
        return Response({'error': 'No permission'}, status=status.HTTP_403_FORBIDDEN)
    
    username = request.data.get('username')
    if not username:
        return Response({'error': 'Username required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if project.participants.filter(id=user.id).exists():
        return Response({'error': 'User already in project'}, status=status.HTTP_400_BAD_REQUEST)
    
    ProjectMembership.objects.create(
        user=user,
        project=project,
        role='participant'
    )
    
    return Response({'message': f'User {username} added to project'})

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_project_members(request, project_id):
    project = get_object_or_404(Project, id=project_id)
    
    if not (project.creator == request.user or project.participants.filter(id=request.user.id).exists()):
        return Response({'error': 'No permission'}, status=status.HTTP_403_FORBIDDEN)
    
    memberships = ProjectMembership.objects.filter(project=project)
    members_data = []
    
    for membership in memberships:
        members_data.append({
            'id': membership.user.id,
            'username': membership.user.username,
            'email': membership.user.email,
            'role': membership.role,
            'joined_at': membership.joined_at
        })
    
    return Response(members_data)

class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'description']
    
    def get_queryset(self):
        user = self.request.user
        return Project.objects.filter(
            Q(creator=user) | Q(participants=user)
        ).distinct()
    
    def perform_create(self, serializer):
        project = serializer.save(creator=self.request.user)
        ProjectMembership.objects.create(
            user=self.request.user,
            project=project,
            role='creator'
        )
    
    @action(detail=True, methods=['get'])
    def tasks(self, request, pk=None):
        project = self.get_object()
        tasks = project.tasks.all()
        serializer = TaskSerializer(tasks, many=True)
        return Response(serializer.data)

class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return Task.objects.filter(
            Q(project__creator=user) | Q(project__participants=user)
        ).distinct()
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
