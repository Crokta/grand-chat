import json
import logging

import requests
from django.conf import settings
from django.db import transaction
from requests.adapters import HTTPAdapter
from urllib3 import Retry

from .models import RoomMember


class CentrifugoMixin:
    # A helper method to return the list of channels for all current members of specific room.
    # So that the change in the room may be broadcasted to all the members.
    def get_room_member_channels(self, room_id):
        members = RoomMember.objects.filter(room_id=room_id).values_list('user', flat=True)
        return [f'personal:{user_id}' for user_id in members]

    def broadcast_room(self, room_id, broadcast_payload):
        # Using Centrifugo HTTP API is the simplest way to send real-time message, and usually
        # it provides the best latency. The trade-off here is that error here may result in
        # lost real-time event. Depending on the application requirements this may be fine or not.
        def broadcast():
            session = requests.Session()
            retries = Retry(total=1, backoff_factor=1, status_forcelist=[500, 502, 503, 504])
            session.mount('http://', HTTPAdapter(max_retries=retries))
            try:
                session.post(
                    "http://centrifugo:8000/api/broadcast",
                    data=json.dumps(broadcast_payload),
                    headers={
                        'Content-type': 'application/json',
                        'X-API-Key': settings.CENTRIFUGO_HTTP_API_KEY,
                        'X-Centrifugo-Error-Mode': 'transport'
                    }
                )
            except requests.exceptions.RequestException as e:
                logging.error(e)

        # We need to use on_commit here to not send notification to Centrifugo before
        # changes applied to the database. Since we are inside transaction.atomic block
        # broadcast will happen only after successful transaction commit.
        transaction.on_commit(broadcast)
