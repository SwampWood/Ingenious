from django.shortcuts import render
from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Project, Task, ProjectMembership
from .serializers import ProjectSerializer, TaskSerializer, ProjectMembershipSerializer

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
