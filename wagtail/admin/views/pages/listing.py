from django.conf import settings
from django.db.models import Count
from django.shortcuts import get_object_or_404, redirect
from django.urls import reverse
from django.utils.decorators import method_decorator
from django.utils.translation import gettext_lazy as _

from wagtail import hooks
from wagtail.admin.auth import user_has_any_page_permission, user_passes_test
from wagtail.admin.navigation import get_explorable_root_page
from wagtail.admin.views.generic import IndexView
from wagtail.models import Page, UserPagePermissionsProxy


class ListingView(IndexView):
    model = Page
    template_name = "wagtailadmin/pages/index.html"
    paginate_by = 50
    header_icon = "page"
    context_object_name = "pages"
    default_ordering = "-latest_revision_created_at"
    title = _("Exploring")

    def setup(self, request, *args, **kwargs):
        super().setup(request, *args, **kwargs)
        if "parent_page_id" in self.kwargs:
            parent_page = get_object_or_404(Page, id=kwargs["parent_page_id"])
        else:
            parent_page = Page.get_first_root_node()

        # This will always succeed because of the @user_passes_test above.
        root_page = get_explorable_root_page(request.user)

        # If this page isn't a descendant of the user's explorable root page,
        # then redirect to that explorable root page instead.
        if not (
            parent_page.pk == root_page.pk or parent_page.is_descendant_of(root_page)
        ):
            return redirect("wagtailadmin_explore", root_page.pk)

        self.parent_page = parent_page.specific
        self.root_page = root_page
        self.locale = self.get_locale()

    def get_page_subtitle(self):
        return self.parent_page.get_admin_display_title()

    def get_valid_orderings(self):
        return [
            "title",
            "-title",
            "content_type",
            "-content_type",
            "live",
            "-live",
            "latest_revision_created_at",
            "-latest_revision_created_at",
            "ord",
        ]

    def get_queryset(self):
        user_perms = UserPagePermissionsProxy(self.request.user)
        pages = (
            self.parent_page.get_children().prefetch_related(
                "content_type", "sites_rooted_here"
            )
            & user_perms.explorable_pages()
        )

        ordering = self.get_ordering()

        if ordering == "ord":
            # preserve the native ordering from get_children()
            pass
        elif ordering == "latest_revision_created_at":
            # order by oldest revision first.
            # Special case NULL entries - these should go at the top of the list.
            # Do this by annotating with Count('latest_revision_created_at'),
            # which returns 0 for these
            pages = pages.annotate(
                null_position=Count("latest_revision_created_at")
            ).order_by("null_position", "latest_revision_created_at")
        elif ordering == "-latest_revision_created_at":
            # order by oldest revision first.
            # Special case NULL entries - these should go at the end of the list.
            pages = pages.annotate(
                null_position=Count("latest_revision_created_at")
            ).order_by("-null_position", "-latest_revision_created_at")
        else:
            pages = pages.order_by(ordering)

        # We want specific page instances, but do not need streamfield values here
        pages = pages.defer_streamfields().specific()

        # allow hooks defer_streamfieldsyset
        for hook in hooks.get_hooks("construct_explorer_page_queryset"):
            pages = hook(self.parent_page, pages, self.request)

        # Annotate queryset with various states to be used later for performance optimisations
        if getattr(settings, "WAGTAIL_WORKFLOW_ENABLED", True):
            pages = pages.prefetch_workflow_states()

        pages = pages.annotate_site_root_state().annotate_approved_schedule()

        return pages

    def get_paginate_by(self, queryset):

        # Don't paginate if sorting by page order - all pages must be shown to
        # allow drag-and-drop reordering
        if self.get_ordering() == "ord":
            return None

        return super().get_paginate_by(queryset)

    def get_locale(self):
        if getattr(settings, "WAGTAIL_I18N_ENABLED", False):
            if not self.parent_page.is_root():
                return self.parent_page.locale
        return None

    @method_decorator(user_passes_test(user_has_any_page_permission))
    def dispatch(self, request, *args, **kwargs):
        return super().dispatch(request, *args, **kwargs)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)

        parent_page = self.parent_page
        ordering = self.get_ordering()
        show_ordering_column = ordering == "ord"

        context.update(
            {
                "ordering": ordering,
                "locale": self.locale,
                "parent_page": parent_page.specific,
                # "pages" - not including paginator!
                "show_bulk_actions": not show_ordering_column,
                "show_locale_labels": False,
                "show_ordering_column": show_ordering_column,
                "translations": [],
            }
        )

        print('show_ordering_column', show_ordering_column)
        print('ordering', ordering)

        if getattr(settings, "WAGTAIL_I18N_ENABLED", False):
            if not parent_page.is_root():
                translations = [
                    {
                        "locale": translation.locale,
                        "url": reverse("wagtailadmin_explore", args=[translation.id]),
                    }
                    for translation in parent_page.get_translations()
                    .only("id", "locale")
                    .select_related("locale")
                ]

                context["translations"] = translations
            else:
                context["show_locale_labels"] = True

        return context
