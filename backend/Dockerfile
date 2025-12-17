FROM python:3.11-slim

WORKDIR /usr/src/app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN python manage.py collectstatic --noinput

RUN useradd -m -u 1000 appuser

RUN chown -R appuser:appuser /usr/src/app/staticfiles

USER appuser

EXPOSE 8000