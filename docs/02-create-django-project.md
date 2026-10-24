# Step 2 — Create the Django Project

## Objective

Create the Django backend that will handle Google Sign-In for a separate React frontend.

Django provides the project configuration, URL routing, middleware, database integration, and authentication infrastructure required by the application.

## Prerequisites

- Python installed.
- `uv` installed.
- A project directory at `~/Desktop/DJangoAuth`.
- Django installed in the project's virtual environment.
- The environment configured to activate automatically through `direnv`.

## 1. Navigate to the Project Directory

```bash
cd ~/Desktop/DJangoAuth
```

## 2. Install Django if Necessary

If starting from a fresh project, initialize the Python project and install Django:

```bash
uv init
uv add django
```

If `uv init` reports that the project is already initialized, retain the existing project configuration and run only the necessary dependency installation command.

## 3. Create the Django Project

Run:

```bash
django-admin startproject config .
```

The command creates a Django project named `config` in the current directory.

The final `.` is important. It prevents Django from creating an additional nested project directory.

## 4. Understand the Project Structure

The generated structure is:

```text
DJangoAuth/
├── .envrc
├── .venv/
├── docs/
├── manage.py
├── pyproject.toml
├── uv.lock
└── config/
    ├── __init__.py
    ├── asgi.py
    ├── settings.py
    ├── urls.py
    └── wsgi.py
```

### Important Files

**`manage.py`**

The command-line entry point for project-specific Django management commands.

Examples:

```bash
python manage.py check
python manage.py migrate
python manage.py runserver
```

**`config/settings.py`**

Contains the project's configuration, including installed applications, middleware, database settings, and authentication settings.

**`config/urls.py`**

Defines the root URL routing table. Later, this is where we will connect the authentication endpoints.

**`config/asgi.py`**

Provides the ASGI application entry point for compatible application servers.

**`config/wsgi.py`**

Provides the WSGI application entry point for compatible application servers.

## 5. Check the Configuration

Run:

```bash
python manage.py check
```

Django checks the project for common configuration errors.

A successful result looks like:

```text
System check identified no issues (0 silenced).
```

## 6. Start the Development Server

Run:

```bash
python manage.py runserver
```

Open the following address in a browser:

```text
http://127.0.0.1:8000/
```

The default Django welcome page should appear.

Stop the server by pressing `Ctrl+C` in the terminal.

## Result

The Django project has been created and can run locally.

The `config` package contains the project configuration. Authentication-specific functionality will be organized separately in an application named `accounts`.

## Next Step

Create the `accounts` application and define the custom user model before running the initial database migrations.
