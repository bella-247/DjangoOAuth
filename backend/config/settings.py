import os
from pathlib import Path

from dotenv import load_dotenv

from .authentication.conf import (
    AUTHENTICATION_BACKENDS,
    DJANGO_ACCESS_TOKEN_LIFETIME_SECONDS,
    DJANGO_AUTH_FRONTEND_URL,
    CORS_ALLOW_CREDENTIALS,
    CORS_ALLOWED_ORIGINS,
    CSRF_COOKIE_HTTPONLY,
    CSRF_COOKIE_SAMESITE,
    CSRF_COOKIE_SECURE,
    CSRF_TRUSTED_ORIGINS,
    HEADLESS_FRONTEND_URLS,
    HEADLESS_ONLY,
    INSTALLED_APPS,
    MIDDLEWARE,
    SECURE_CONTENT_TYPE_NOSNIFF,
    SECURE_REFERRER_POLICY,
    SECURE_HSTS_INCLUDE_SUBDOMAINS,
    SECURE_HSTS_PRELOAD,
    SECURE_HSTS_SECONDS,
    SECURE_SSL_REDIRECT,
    SESSION_COOKIE_HTTPONLY,
    SESSION_COOKIE_DOMAIN,
    SESSION_COOKIE_SAMESITE,
    SESSION_COOKIE_SECURE,
    SITE_ID,
    SOCIALACCOUNT_ADAPTER,
    SOCIALACCOUNT_PROVIDERS,
)

BASE_DIR = Path(__file__).resolve().parent.parent

load_dotenv(BASE_DIR / ".env")

SECRET_KEY = os.environ["DJANGO_SECRET_KEY"]

DEBUG = os.getenv("DJANGO_DEBUG", "False").strip() == "True"

ALLOWED_HOSTS = [
    host.strip()
    for host in os.getenv("DJANGO_ALLOWED_HOSTS", "").split(",")
    if host.strip()
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"


# Database
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}


# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]


# Internationalization
LANGUAGE_CODE = "en-us"

TIME_ZONE = "UTC"

USE_I18N = True

USE_TZ = True


# Static files
STATIC_URL = "static/"


# Email
MAILERS = {
    "default": {
        "BACKEND": os.getenv(
            "DJANGO_EMAIL_BACKEND",
            "django.core.mail.backends.console.EmailBackend",
        ),
    },
}