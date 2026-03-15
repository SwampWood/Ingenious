from rest_framework import serializers
from .models import ChatRoom, Message
from users.serializers import UserSerializer

class MessageSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    
    class Meta:
        model = Message
        fields = ['id', 'room', 'author', 'content', 'timestamp', 'read_by']
        read_only_fields = ['timestamp', 'read_by']

class ChatRoomSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)
    participants = UserSerializer(many=True, read_only=True)
    
    class Meta:
        model = ChatRoom
        fields = ['id', 'room_type', 'project', 'task', 'participants', 'created_at', 'messages']
        read_only_fields = ['created_at']
