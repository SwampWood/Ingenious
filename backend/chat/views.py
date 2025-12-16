from django.shortcuts import render
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import ChatRoom, Message
from .serializers import ChatRoomSerializer, MessageSerializer

class ChatRoomViewSet(viewsets.ModelViewSet):
    serializer_class = ChatRoomSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return ChatRoom.objects.filter(participants=user)
    
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
