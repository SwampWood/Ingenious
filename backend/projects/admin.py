from django.contrib import admin
from .models import Project, Task, ProjectMembership

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ['title', 'creator', 'created_at', 'is_completed']
    list_filter = ['is_completed', 'created_at']

@admin.register(Task) 
class TaskAdmin(admin.ModelAdmin):
    list_display = ['title', 'project', 'assigned_to', 'status', 'deadline']
    list_filter = ['status', 'project']
