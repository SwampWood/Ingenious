from django.shortcuts import render
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import ChatRoom, Message
from .serializers import ChatRoomSerializer, MessageSerializer
from django.contrib.auth import get_user_model

User = get_user_model()

def create_system_message(room, content):
    try:
        author = User.objects.get(username='system')
    except User.DoesNotExist:
        author = User.objects.create_user(
            username='system',
            email='system@example.com',
            password=User.objects.make_random_password()
        )
        author.is_active = True
        author.is_staff = False
        author.is_superuser = False
        author.save()
    
    message = Message.objects.create(
        room=room,
        author=author,
        content=content
    )
    message.read_by.add(author)
    return message


class ChatRoomViewSet(viewsets.ModelViewSet):
    serializer_class = ChatRoomSerializer
    permission_classes = []
    
    def get_queryset(self):
        project_id = self.request.query_params.get('project')
        
        if project_id:
            return ChatRoom.objects.filter(project_id=project_id)
        return ChatRoom.objects.all()
    
    def create(self, request, *args, **kwargs):
        project_id = request.data.get('project')
        
        if project_id:
            existing = ChatRoom.objects.filter(
                project_id=project_id,
                room_type='project'
            ).first()
            
            if existing:
                serializer = self.get_serializer(existing)
                return Response(serializer.data, status=200)

            from projects.models import Project
            try:
                project = Project.objects.get(id=project_id)

                room = ChatRoom.objects.create(
                    room_type='project',
                    project=project,
                )

                room.participants.add(project.creator)
                for membership in project.projectmembership_set.all():
                    room.participants.add(membership.user)
                
                serializer = self.get_serializer(room)
                return Response(serializer.data, status=201)
                
            except Project.DoesNotExist:
                pass
        
        return super().create(request, *args, **kwargs)
    
    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        room = self.get_object()
        messages = room.messages.all().order_by('timestamp')
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)

class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return Message.objects.filter(
            Q(room__participants=user) | Q(author=user)
        ).distinct()
    
    def perform_create(self, serializer):
        message = serializer.save(author=self.request.user)
        message.read_by.add(self.request.user)
