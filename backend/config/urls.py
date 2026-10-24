from django.contrib import admin
from django.urls import path
from config.authentication.urls import urlpatterns as auth_urlpatterns

urlpatterns = [
    path("admin/", admin.site.urls),
    *auth_urlpatterns,
]