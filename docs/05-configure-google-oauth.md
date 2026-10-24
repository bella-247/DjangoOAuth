# Step 5 — Configure Google OAuth

## Goal

Configure Google OAuth credentials for `django-allauth` and associate the Google provider with the local Django Site.

At the end of this step:

- A Google OAuth client exists in Google Cloud Console.
- The Django Site record is configured for local development.
- One Google `SocialApp` record exists in the database.
- The Google app is associated with the local Site.
- The complete sign-in flow has **not** yet been tested.

## Prerequisites

- The Django project is located at `~/Desktop/DJangoAuth`.
- The project's virtual environment is activated automatically through `direnv`.
- Django and `django-allauth` are installed.
- The allauth social-account and Google provider apps are enabled.
- Database migrations have been applied.
- `config/urls.py` includes the allauth routes.

Move to the project directory and verify the environment:

```bash
cd ~/Desktop/DJangoAuth
python manage.py check
```

Expected result:

```text
System check identified no issues (0 silenced).
```

## 1. Understand the configuration

Three components participate in this setup.

### Google OAuth client

Google Cloud Console generates a client ID and client secret. They identify the OAuth client and allow the backend to authenticate its requests as that client.

The client ID is not a password, but the client secret is confidential and must not be committed to Git or exposed to the browser.

### Django Site

The `django.contrib.sites` framework stores information identifying a site served by the Django application.

Our local Site is:

| Field | Value |
|---|---|
| ID | `1` |
| Domain | `localhost:8000` |
| Name | `DjangoAuth Local` |

We updated the existing Site rather than creating a duplicate.

### django-allauth SocialApp

The `SocialApp` model stores a social provider's configuration, including the provider name, client ID, secret, and associated Sites.

Our intended configuration is:

| Field | Value |
|---|---|
| Provider | `google` |
| Name | `Google OAuth` |
| Site | `DjangoAuth Local` |

The secret must not be printed in diagnostic output.

## 2. Configure the Google OAuth client

Open the [Google Cloud Console — Google Auth Platform clients](https://console.cloud.google.com/auth/clients).

1. Select or create a Google Cloud project.
2. Configure the Google Auth Platform consent screen if prompted.
3. For a personal development test, select the appropriate audience. If the app is in testing mode, add the Google account used for testing as a test user.
4. Create an OAuth client with application type **Web application**.
5. Register the following local development URLs.

Authorized JavaScript origin:

```text
http://localhost:8000
```

Authorized redirect URI:

```text
http://localhost:8000/accounts/google/login/callback/
```

The redirect URI must match exactly. The callback is provided by django-allauth, not by React.

6. Create the client and retain the generated credentials securely.
7. Do not commit the downloaded JSON file or share its client secret.

Google may change its console interface, so use the current labels in the console if they differ from these instructions.

## 3. Configure the Django Site record

Inspect the existing records:

```bash
python manage.py shell -c "from django.contrib.sites.models import Site; print(list(Site.objects.values('id', 'domain', 'name')))"
```

Update Site ID 1:

```bash
python manage.py shell -c "from django.contrib.sites.models import Site; site = Site.objects.get(pk=1); site.domain = 'localhost:8000'; site.name = 'DjangoAuth Local'; site.save(); print(site.id, site.domain, site.name)"
```

Verify:

```bash
python manage.py shell -c "from django.contrib.sites.models import Site; print(list(Site.objects.values('id', 'domain', 'name')))"
```

Expected Site record:

```text
[{'id': 1, 'domain': 'localhost:8000', 'name': 'DjangoAuth Local'}]
```

This changes a database record, not the schema. No migration is required.

## 4. Check whether a Google SocialApp already exists

Before creating a record, check for an existing Google provider configuration:

```bash
python manage.py shell -c "from allauth.socialaccount.models import SocialApp; print(list(SocialApp.objects.filter(provider='google').values('id', 'name', 'client_id')))"
```

An empty list means there is no existing Google configuration.

Do not create duplicate Google records for the same intended provider and Site. Multiple matching provider configurations can cause errors when allauth resolves the provider.

## 5. Create the SocialApp securely

Start the Django shell:

```bash
python manage.py shell
```

Enter these statements at the Python prompt:

```python
from getpass import getpass
from allauth.socialaccount.models import SocialApp
from django.contrib.sites.models import Site

client_id = input("Google Client ID: ").strip()
client_secret = getpass("Google Client Secret (input hidden): ")

site = Site.objects.get(pk=1)

app = SocialApp.objects.create(
    provider="google",
    name="Google OAuth",
    client_id=client_id,
    secret=client_secret,
)

app.sites.add(site)

print("Created:", app.name)
print("Provider:", app.provider)
print(
    "Associated sites:",
    list(app.sites.values("id", "domain", "name")),
)
```

Enter the client ID when prompted. Paste the client secret at the hidden prompt; it should not appear as you type or paste.

The record is created by `SocialApp.objects.create(...)`. The `app.sites.add(site)` call establishes the relationship between the provider configuration and the Site.

If the creation command fails, inspect the database before trying again. Do not blindly repeat the creation command because the record may already exist.

Exit the shell:

```python
exit()
```

## 6. Verify the configuration

Run:

```bash
python manage.py shell -c "from allauth.socialaccount.models import SocialApp; apps = list(SocialApp.objects.filter(provider='google')); print('Google apps:', len(apps)); [(print('Name:', a.name, '| Client ID format looks valid:', a.client_id.endswith('.apps.googleusercontent.com'), '| Site domains:', list(a.sites.values_list('domain', flat=True)))) for a in apps]"
```

Verified result:

```text
Google apps: 1
Name: Google OAuth | Client ID format looks valid: True | Site domains: ['localhost:8000']
```

This confirms:

- Exactly one Google `SocialApp` exists.
- The client ID has the expected Google OAuth client ID suffix.
- The provider is associated with the correct local Site.

It does **not** prove that the client secret is correct or that Google sign-in works end to end.

## 7. Configuration checklist

- [x] Google OAuth client created.
- [x] Local Site updated to `localhost:8000`.
- [x] Google `SocialApp` created in the database.
- [x] Google provider associated with Site ID 1.
- [x] Client ID format verified without printing the credential.
- [ ] End-to-end Google sign-in tested.
- [ ] React frontend integrated with the Django authentication flow.
- [ ] Production callback URLs and secret management configured.

## Important security notes

- Never commit OAuth client secrets or downloaded credential JSON files.
- Do not expose the client secret to React or other browser code.
- Keep development credentials separate from production credentials.
- Use HTTPS and production-appropriate settings when deploying.
- Treat the successful configuration check as a database verification, not an end-to-end authentication test.

## Step 5 complete

The local Site and Google provider configuration are stored in the database and verified. The next step will continue from this state and test the authentication endpoints before integrating the separate React frontend.
