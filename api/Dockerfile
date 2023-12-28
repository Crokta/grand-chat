FROM python:3.11.4-slim-buster

WORKDIR /usr/src/app

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1


#RUN  apt-get update \
#    && apt-get install -y gcc python3-dev musl-dev libmagic1 libffi-dev git netcat-traditional rsync

# Install dependencies
COPY pyproject.toml pyproject.toml
COPY poetry.lock poetry.lock
RUN pip install poetry==1.7.1
RUN poetry config virtualenvs.create false
RUN poetry install

# Copy entrypoint.sh
COPY ./entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

COPY . /usr/src/app

ENTRYPOINT [ "/entrypoint.sh" ]