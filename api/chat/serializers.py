from django.contrib.auth.models import User
from rest_framework import serializers

from .models import Room, Message, RoomMember


class RoomSearchSerializer(serializers.ModelSerializer):
    is_member = serializers.BooleanField(read_only=True)

    class Meta:
        model = Room
        fields = '__all__'


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username']


class LastMessageSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'content', 'user', 'created_at']


class RoomSerializer(serializers.ModelSerializer):
    last_message = LastMessageSerializer(read_only=True)
    member_count = serializers.SerializerMethodField()

    def get_member_count(self, obj):
        return obj.memberships.count()

    class Meta:
        model = Room
        fields = ['id', 'name', 'version', 'created_at', 'bumped_at', 'last_message', 'member_count']


class MessageRoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = ['id', 'version']


class MessageSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    room = MessageRoomSerializer(read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'content', 'user', 'room', 'created_at']


class RoomMemberSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    room = RoomSerializer(read_only=True)

    class Meta:
        model = RoomMember
        fields = ['room', 'user']
