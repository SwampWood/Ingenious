from django.shortcuts import render, get_object_or_404
from django.contrib.auth import get_user_model
from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Q
from .models import Project, Task, ProjectMembership
from .serializers import ProjectSerializer, TaskSerializer, ProjectMembershipSerializer
from chat.models import ChatRoom
from chat.views import create_system_message



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
    send_member_notification(project, user, 'joined', request.user)
    
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

@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def remove_project_member(request, project_id, user_id):
    project = get_object_or_404(Project, id=project_id)

    if not (project.creator == request.user):
        return Response({'error': 'Только создатель может удалять участников'}, 
                       status=status.HTTP_403_FORBIDDEN)

    if project.creator_id == user_id:
        return Response({'error': 'Нельзя удалить создателя проекта'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(id=user_id)
        membership = ProjectMembership.objects.get(
            project=project,
            user=user
        )
        membership.delete()
        send_member_notification(project, user, 'left', request.user)
        
        return Response({'message': 'Участник удален'})
    except (ProjectMembership.DoesNotExist, User.DoesNotExist):
        return Response({'error': 'Участник не найден в проекте'}, 
                       status=status.HTTP_404_NOT_FOUND)

def send_member_notification(project, member_user, action, action_user):
    try:
        room = ChatRoom.objects.filter(
            project=project,
            room_type='project'
        ).first()
        
        if room:
            messages = {
                'joined': f'👋 {member_user.username} присоединился к проекту',
                'left': f'🚪 {member_user.username} покинул проект',
                'invited': f'📨 {action_user.username} пригласил {member_user.username} в проект',
                'removed': f'👢 {action_user.username} удалил {member_user.username} из проекта',
            }
            
            if action in messages:
                create_system_message(room, messages[action])
    except Exception as e:
        print(f"Ошибка отправки уведомления участника: {e}")

class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'description']
    
    def get_queryset(self):
        queryset = Project.objects.all()

        participant_id = self.request.query_params.get('participant')
        if participant_id:
            try:
                participant_id = int(participant_id)
                queryset = queryset.filter(participants__id=participant_id)
            except (ValueError, TypeError):
                pass
        
        return queryset
    
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
        task = serializer.save(created_by=self.request.user)
        self.send_task_notification(task, 'created')
    
    def perform_update(self, serializer):
        old_task = self.get_object()
        new_task = serializer.save()

        self.send_task_notification(new_task, 'updated', old_task)
    
    def perform_destroy(self, instance):
        self.send_task_notification(instance, 'deleted')
        instance.delete()
    
    def send_task_notification(self, task, action, old_task=None):
        try:
            from chat.models import ChatRoom
            from chat.views import create_system_message
            room = ChatRoom.objects.filter(
                project=task.project,
                room_type='project'
            ).first()
            
            if not room:
                from .models import Project
                project = Project.objects.get(id=task.project.id)
                room = ChatRoom.objects.create(
                    room_type='project',
                    project=project,
                )
                room.participants.add(project.creator)
                for membership in project.projectmembership_set.all():
                    room.participants.add(membership.user)
            
            messages = {
                'created': f'📋 Создана новая задача: "{task.title}"',
                'updated': self.get_task_update_message(task, old_task),
                'deleted': f'🗑️ Удалена задача: "{task.title}"',
                'status_changed': self.get_status_message(task, old_task),
            }
            
            if action in messages and messages[action]:
                create_system_message(room, messages[action])
        except Exception as e:
            print(f"Ошибка отправки уведомления: {e}")
    
    def get_task_update_message(self, new_task, old_task):
        if not old_task:
            return None
            
        changes = []
        
        if old_task.title != new_task.title:
            changes.append(f'название: "{old_task.title}" → "{new_task.title}"')
        
        if old_task.assigned_to != new_task.assigned_to:
            old_assignee = old_task.assigned_to.username if old_task.assigned_to else "никто"
            new_assignee = new_task.assigned_to.username if new_task.assigned_to else "никто"
            changes.append(f'исполнитель: {old_assignee} → {new_assignee}')
        
        if old_task.deadline != new_task.deadline:
            old_date = old_task.deadline.strftime('%d.%m.%Y') if old_task.deadline else "нет"
            new_date = new_task.deadline.strftime('%d.%m.%Y') if new_task.deadline else "нет"
            changes.append(f'дедлайн: {old_date} → {new_date}')
        
        if old_task.status != new_task.status:
            status_names = {
                'todo': 'К выполнению',
                'in_progress': 'В процессе',
                'done': 'Выполнено'
            }
            old_status = status_names.get(old_task.status, old_task.status)
            new_status = status_names.get(new_task.status, new_task.status)
            changes.append(f'статус: {old_status} → {new_status}')
        
        if changes:
            return f'📝 Задача "{new_task.title}" изменена: {", ".join(changes)}'
        return None
    
    def get_status_message(self, task, old_task):
        if old_task and old_task.status != task.status:
            status_names = {
                'todo': 'К выполнению',
                'in_progress': 'В процессе',
                'done': 'Выполнено'
            }
            old_status = status_names.get(old_task.status, old_task.status)
            new_status = status_names.get(task.status, task.status)
            
            emoji = {
                'todo': '⏳',
                'in_progress': '🔄',
                'done': '✅'
            }.get(task.status, '📋')
            
            return f'{emoji} Задача "{task.title}" изменила статус: {old_status} → {new_status}'
        return None
