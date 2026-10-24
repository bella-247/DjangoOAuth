from django.http import JsonResponse
from django.views.decorators.http import require_GET


@require_GET
def current_user(request):
    if not request.user.is_authenticated:
        return JsonResponse(
            {"detail": "Authentication credentials were not provided."},
            status=401,
        )

    return JsonResponse(
        {
            "status": 200,
            "data": {
                "user": {
                    "id": request.user.pk,
                    "username": request.user.get_username(),
                    "email": request.user.email,
                }
            },
        }
    )
