from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProjectViewSet, TaskViewSet, add_project_member, get_project_members

router = DefaultRouter()
router.register(r'projects', ProjectViewSet, basename='project')
router.register(r'tasks', TaskViewSet, basename='task')

urlpatterns = [
    path('', include(router.urls)),
    path('projects/<int:project_id>/add_member/', add_project_member, name='add_project_member'),
    path('projects/<int:project_id>/members/', get_project_members, name='get_project_members'),
]
