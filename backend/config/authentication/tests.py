from django.contrib.sites.models import Site
from django.contrib.auth import get_user_model
from django.middleware.csrf import get_token
from django.test import Client
from django.test import TestCase
from django.test import override_settings

from allauth.socialaccount.models import SocialApp

from config.authentication.conf import build
from config.authentication.utils import load_env_file
from config.authentication.urls import urlpatterns as auth_urlpatterns
from config.authentication.site_helpers import ensure_site, get_site


class HeadlessAuthenticationTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        # Ensure the test Site exists with the correct domain
        site = Site.objects.get(pk=1)
        site.domain = "testserver"
        site.name = "testserver"
        site.save()

    def test_headless_config_lists_google_provider(self):
        response = self.client.get(
            "/_allauth/browser/v1/config",
            HTTP_ORIGIN="http://localhost:5173",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.headers["Access-Control-Allow-Origin"],
            "http://localhost:5173",
        )
        self.assertIn("csrftoken", response.cookies)

        payload = response.json()
        self.assertEqual(payload["status"], 200)
        providers = payload["data"]["socialaccount"]["providers"]
        google_providers = [p for p in providers if p["id"] == "google"]
        self.assertGreaterEqual(len(google_providers), 1)
        self.assertIn("provider_redirect", google_providers[0]["flows"])

    def test_anonymous_session_is_not_authenticated(self):
        response = self.client.get("/_allauth/browser/v1/auth/session")

        self.assertEqual(response.status_code, 401)

        payload = response.json()
        self.assertEqual(payload["status"], 401)
        self.assertFalse(payload["meta"]["is_authenticated"])
        self.assertEqual(
            {flow["id"] for flow in payload["data"]["flows"]},
            {"login", "signup", "provider_redirect", "provider_token"},
        )

    def test_protected_current_user_endpoint_requires_authentication(self):
        response = self.client.get("/api/me")

        self.assertEqual(response.status_code, 401)
        self.assertEqual(
            response.json()["detail"],
            "Authentication credentials were not provided.",
        )

    def test_authenticated_session_and_current_user_endpoint(self):
        user = get_user_model().objects.create_user(
            username="test-user",
            email="test@example.com",
            password="test-password",
        )
        self.client.force_login(user)

        session_response = self.client.get("/_allauth/browser/v1/auth/session")
        profile_response = self.client.get("/api/me")

        self.assertEqual(session_response.status_code, 200)
        self.assertTrue(session_response.json()["meta"]["is_authenticated"])
        self.assertEqual(profile_response.status_code, 200)
        profile_payload = profile_response.json()
        self.assertEqual(profile_payload["status"], 200)
        self.assertEqual(profile_payload["data"]["user"]["username"], "test-user")

    def test_logout_clears_authenticated_session(self):
        user = get_user_model().objects.create_user(
            username="logout-user",
            password="test-password",
        )
        self.client.force_login(user)

        response = self.client.delete("/_allauth/browser/v1/auth/session")

        self.assertEqual(response.status_code, 401)
        self.assertFalse(response.json()["meta"]["is_authenticated"])
        self.assertEqual(
            self.client.get("/_allauth/browser/v1/auth/session").status_code,
            401,
        )
        self.assertEqual(self.client.get("/api/me").status_code, 401)

    def test_logout_requires_csrf_token(self):
        user = get_user_model().objects.create_user(
            username="csrf-user",
            password="test-password",
        )
        csrf_client = Client(enforce_csrf_checks=True)
        csrf_client.force_login(user)

        response = csrf_client.delete("/_allauth/browser/v1/auth/session")

        self.assertEqual(response.status_code, 403)

    def test_build_without_google_credentials(self):
        settings = build({
            "DJANGO_FRONTEND_URL": "http://localhost:5173",
        })
        self.assertEqual(settings["SOCIALACCOUNT_PROVIDERS"], {})

    def test_build_with_google_credentials(self):
        settings = build({
            "DJANGO_FRONTEND_URL": "http://localhost:5173",
            "DJANGO_GOOGLE_CLIENT_ID": "test.apps.googleusercontent.com",
            "DJANGO_GOOGLE_CLIENT_SECRET": "secret",
        })
        self.assertIn("google", settings["SOCIALACCOUNT_PROVIDERS"])
        self.assertEqual(
            settings["SOCIALACCOUNT_PROVIDERS"]["google"]["APP"]["client_id"],
            "test.apps.googleusercontent.com",
        )

    def test_build_multiple_providers(self):
        settings = build({
            "DJANGO_FRONTEND_URL": "http://localhost:5173",
            "DJANGO_AUTH_PROVIDERS": "google,github",
            "DJANGO_GOOGLE_CLIENT_ID": "google-id",
            "DJANGO_GOOGLE_CLIENT_SECRET": "google-secret",
            "DJANGO_GITHUB_CLIENT_ID": "github-id",
            "DJANGO_GITHUB_CLIENT_SECRET": "github-secret",
        })
        self.assertIn("google", settings["SOCIALACCOUNT_PROVIDERS"])
        self.assertIn("github", settings["SOCIALACCOUNT_PROVIDERS"])
        self.assertEqual(
            settings["SOCIALACCOUNT_PROVIDERS"]["google"]["APP"]["client_id"],
            "google-id",
        )
        self.assertEqual(
            settings["SOCIALACCOUNT_PROVIDERS"]["github"]["APP"]["client_id"],
            "github-id",
        )

    def test_frontend_url_normalization(self):
        settings1 = build({"DJANGO_FRONTEND_URL": "http://localhost:5173"})
        settings2 = build({"DJANGO_FRONTEND_URL": "http://localhost:5173/"})
        self.assertEqual(settings1["HEADLESS_FRONTEND_URLS"], settings2["HEADLESS_FRONTEND_URLS"])
        for v in settings1["HEADLESS_FRONTEND_URLS"].values():
            self.assertFalse(v.endswith("/"))

    def test_load_env_file_custom_path(self):
        import tempfile
        import os
        from pathlib import Path
        with tempfile.TemporaryDirectory() as tmpdir:
            env_file = Path(tmpdir) / "custom.env"
            env_file.write_text("TEST_VAR=custom_value\n")
            test_env = {}
            load_env_file(env_file, test_env)
            self.assertEqual(test_env.get("TEST_VAR"), "custom_value")
            # Should not pollute os.environ
            self.assertIsNone(os.getenv("TEST_VAR"))

    def test_urlpatterns_includes_required_routes(self):
        routes = [str(p.pattern) for p in auth_urlpatterns]
        self.assertTrue(any("accounts/" in r for r in routes))
        self.assertTrue(any("_allauth/" in r for r in routes))
        self.assertTrue(any("api/me" in r for r in routes))

    def test_ensure_site_creates_new(self):
        Site.objects.all().delete()
        site = ensure_site("example.com", "Example")
        self.assertEqual(site.domain, "example.com")
        self.assertEqual(site.name, "Example")
        self.assertEqual(Site.objects.count(), 1)
        self.assertEqual(site.pk, 1)

    def test_ensure_site_updates_existing(self):
        # Use the site created by the previous test (pk=1)
        updated = ensure_site("new.com", "New")
        self.assertEqual(updated.pk, 1)
        self.assertEqual(updated.domain, "new.com")
        self.assertEqual(updated.name, "New")