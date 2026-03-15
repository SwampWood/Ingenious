from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Project, Task, ProjectMembership
from users.serializers import UserSerializer

User = get_user_model()

class ProjectMembershipSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = ProjectMembership
        fields = ['id', 'user', 'role', 'joined_at']
        read_only_fields = ['joined_at']

class TaskSerializer(serializers.ModelSerializer):
    assigned_to = UserSerializer(read_only=True)
    assigned_to_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='assigned_to',
        write_only=True,
        required=False,
        allow_null=True
    )
    
    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'project', 
            'assigned_to', 'assigned_to_id', 'status',
            'deadline', 'created_at', 'parent_task'
        ]
        read_only_fields = ['created_at']

class ProjectSerializer(serializers.ModelSerializer):
    creator = UserSerializer(read_only=True)
    tasks = TaskSerializer(many=True, read_only=True)
    members = ProjectMembershipSerializer(source='projectmembership_set', many=True, read_only=True)
    progress = serializers.SerializerMethodField()
    
    class Meta:
        model = Project
        fields = [
            'id', 'title', 'description', 'creator',
            'created_at', 'deadline', 'is_completed',
            'tasks', 'members', 'progress'
        ]
        read_only_fields = ['created_at']
    
    def get_progress(self, obj):
        total_tasks = obj.tasks.count()
        if total_tasks == 0:
            return 0
        completed_tasks = obj.tasks.filter(status='done').count()
        return int((completed_tasks / total_tasks) * 100)
