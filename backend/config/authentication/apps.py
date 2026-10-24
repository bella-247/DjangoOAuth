"""Django app configuration for the authentication module."""

from django.apps import AppConfig


class AuthenticationConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "config.authentication"
    verbose_name = "Authentication"