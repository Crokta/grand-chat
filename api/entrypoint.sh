#!/bin/sh

python manage.py migrate --no-input

# python manage.py loaddata */fixtures/*.json
# python manage.py collectstatic --no-input --clear

#gunicorn -w 4 core.wsgi -b 0.0.0.0:80 --timeout 420
daphne -b 0.0.0.0 -p 80 core.asgi:application
exec "$@"
