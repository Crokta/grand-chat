from django.db import models
from django.contrib.auth.models import User

from .managers import RoomManager, RoomMemberManager, MessageManager


class Room(models.Model):
    objects = RoomManager()
    name = models.CharField(max_length=255, unique=True)
    version = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    bumped_at = models.DateTimeField(auto_now_add=True)
    last_message = models.ForeignKey(
        'Message', null=True, blank=True, on_delete=models.SET_NULL, related_name='last_message_rooms'
    )

    def increment_version(self):
        self.version += 1
        self.save()
        return self.version

    def __str__(self):
        return self.name


class RoomMember(models.Model):
    objects = RoomMemberManager()
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='memberships')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='rooms')
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('room', 'user')

    def __str__(self):
        return f"{self.user.username} in {self.room.name}"


class Message(models.Model):
    objects = MessageManager()
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='messages')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='messages', null=True)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)