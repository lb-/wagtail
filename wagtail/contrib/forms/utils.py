from django.contrib.contenttypes.models import ContentType
from django.utils.text import slugify

from wagtail.core import hooks
from wagtail.core.models import UserPagePermissionsProxy, get_page_models
from wagtail.core.utils import safe_snake_case, string_to_ascii

_FORM_CONTENT_TYPES = None


def get_field_clean_name(label, legacy=False):
    """
    Converts a user entered field label to a template and JSON safe ascii value to be used
    as the internal key (clean name) for the field.
    Note: Legacy conversion relies on unidecode, to be deprecated in a future release.
    """

    if legacy:
        return str(slugify(string_to_ascii(label)))
    return safe_snake_case(label)


def get_form_types():
    global _FORM_CONTENT_TYPES
    if _FORM_CONTENT_TYPES is None:
        from wagtail.contrib.forms.models import AbstractForm
        form_models = [
            model for model in get_page_models()
            if issubclass(model, AbstractForm)
        ]

        _FORM_CONTENT_TYPES = list(
            ContentType.objects.get_for_models(*form_models).values()
        )
    return _FORM_CONTENT_TYPES


def get_forms_for_user(user):
    """
    Return a queryset of form pages that this user is allowed to access the submissions for
    """
    editable_forms = UserPagePermissionsProxy(user).editable_pages()
    editable_forms = editable_forms.filter(content_type__in=get_form_types())

    # Apply hooks
    for fn in hooks.get_hooks('filter_form_submissions_for_user'):
        editable_forms = fn(user, editable_forms)

    return editable_forms
