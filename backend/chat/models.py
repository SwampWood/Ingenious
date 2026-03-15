from django.db import models
from django.conf import settings

class ChatRoom(models.Model):
    room_type = models.CharField(max_length=10, choices=[('project', 'Проектный чат'), ('task', 'Чат задачи')])
    project = models.ForeignKey('projects.Project', on_delete=models.CASCADE, null=True, blank=True)
    task = models.ForeignKey('projects.Task', on_delete=models.CASCADE, null=True, blank=True)
    participants = models.ManyToManyField(settings.AUTH_USER_MODEL)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.room_type} - {self.project.title if self.project else 'No project'}"

class Message(models.Model):
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name='messages')
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    read_by = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='read_messages', blank=True)

    def __str__(self):
        return f"{self.author.username}: {self.content[:50]}..."
