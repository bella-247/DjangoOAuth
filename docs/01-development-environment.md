# 01 — Development Environment Setup

## Objective

Set up a Python development environment for implementing Google Sign-In using Django 6, django-allauth, and React. We use `uv` for Python dependency management and `direnv` for automatic virtual environment activation.

## 1. Prerequisites

Ensure the following tools are installed on your Linux system:

- Python
- `uv` — Python package and project manager
- `direnv` — automatic environment variable and virtual environment activation
- Git (recommended)

This guide assumes that `direnv` is already configured in your shell.

Verify the installations:

```bash
python --version
uv --version
direnv version
```

## 2. Create the Project Directory

Create a directory for the project and enter it:

```bash
mkdir -p ~/Desktop/DJangoAuth
cd ~/Desktop/DJangoAuth
```

## 3. Install Django and django-allauth

Install Django:

```bash
uv add django
```

Install django-allauth:

```bash
uv add django-allauth
```

These commands create or update the project's dependency configuration and lockfile, and make the packages available in the project's virtual environment.

Django provides the web framework and authentication infrastructure. django-allauth provides social-account integration, including Google's authentication flow.

## 4. Configure Automatic Environment Activation

Create an `.envrc` file in the project root:

```bash
touch .envrc
```

Add the following line to `.envrc`:

```bash
source .venv/bin/activate
```

This activates the virtual environment created by `uv` when `direnv` loads the project's environment.

Authorize the configuration:

```bash
direnv allow
```

**Important:** `.envrc` is executable shell configuration. Only authorize files whose contents you trust. We will not place Google client secrets directly in a committed `.envrc`.

## 5. Verify the Environment

Run:

```bash
which python
python --version
which django-admin
```

The Python executable should resolve to the project's `.venv/bin/python`. The `django-admin` command should also be available inside the environment.

If automatic activation does not work, check that `direnv` is hooked into your shell and that `.envrc` is in the project root.

## 6. Create the Documentation Directory

Create a directory for the project's implementation notes:

```bash
mkdir -p docs
```

Each completed implementation step will have a numbered Markdown document in this directory.

For example:

```text
DJangoAuth/
├── .envrc
├── .venv/
├── docs/
├── pyproject.toml
└── uv.lock
```

The project structure will expand as we create the Django project and its applications.

## Result

The development environment is ready for Django development. Dependencies are managed by `uv`, and `direnv` activates the virtual environment automatically.

## Next Step

Create the Django project and configure the initial application structure for Google Sign-In.
