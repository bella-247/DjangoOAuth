# Step 3 — Initialize the Database

## Objective

Initialize the Django database and understand which user model will be used for Google Sign-In.

We will use Django's built-in `User` model because our current goal is the simplest working Google authentication flow. A custom user model is unnecessary unless the application requires additional fields or customized user behavior.

## 1. Understand the User Model

Django provides its built-in user model through:

```python
django.contrib.auth.models.User
```

It includes standard fields and functionality such as:

- Username
- Email address
- First and last names
- Password hashing and verification
- Active, staff, and superuser status
- Group and permission relationships

django-allauth can use this model to associate a user with a social identity.

## 2. Understand Social Account Relationships

Google authentication involves two distinct concepts:

**Application user**

The Django user represents the person inside our application.

**Social account**

The django-allauth `SocialAccount` model associates that user with an identity from an external provider, such as Google.

Conceptually:

```text
Django User
    |
    +---- SocialAccount
               |
               +---- Provider: Google
               +---- Provider-specific account ID
```

We do not need to create a separate Google user model.

## 3. Apply Database Migrations

From the project root, run:

```bash
python manage.py migrate
```

Django creates the database tables required by its installed applications.

These include tables for authentication, permissions, sessions, content types, and the administration interface.

## 4. Verify Applied Migrations

Run:

```bash
python manage.py showmigrations
```

Applied migrations appear with an `[X]` marker.

Then check the project configuration:

```bash
python manage.py check
```

A successful check reports:

```text
System check identified no issues (0 silenced).
```

## Result

The initial database schema is created, and the project uses Django's built-in user model.

No custom user model or additional authentication app is necessary for this initial implementation.

## Next Step

Configure django-allauth for headless authentication so the React frontend can initiate and complete Google Sign-In without requiring Django-rendered login pages.
