FROM python:3.11-slim

WORKDIR /usr/src/app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN useradd -m -u 1000 appuser

RUN chown -R appuser:appuser /usr/src/app

USER appuser

RUN python manage.py collectstatic --noinput || true

EXPOSE 8000

RUN find /usr/src/app -name "*.pyc" -delete

CMD ["gunicorn", "backend.wsgi:application", "--bind", "0.0.0.0:8000"]
